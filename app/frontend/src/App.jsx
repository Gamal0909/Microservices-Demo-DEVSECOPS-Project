import { useEffect, useMemo, useState } from 'react';

const PRODUCTS_API = import.meta.env.VITE_PRODUCTS_API || '/products/api/products';
const CART_API = import.meta.env.VITE_CART_API || '/cart/api/cart';
const CART_ADD_API = import.meta.env.VITE_CART_ADD_API || '/cart/api/cart/add';
const CART_REMOVE_API = import.meta.env.VITE_CART_REMOVE_API || '/cart/api/cart/remove';
const CART_CLEAR_API = import.meta.env.VITE_CART_CLEAR_API || '/cart/api/cart/clear';
const CHECKOUT_API = import.meta.env.VITE_CHECKOUT_API || '/cart/api/checkout';
const INVENTORY_BASE = import.meta.env.VITE_INVENTORY_BASE || '/inventory';

const fallbackImage = '/images/products/fallback.svg';

function money(value) {
  return `$${Number(value || 0).toFixed(0)}`;
}

async function readJson(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

export default function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({ items: [], totalQuantity: 0, totalPrice: 0 });
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [inventory, setInventory] = useState({});
  const [apiStatus, setApiStatus] = useState({ products: 'checking', cart: 'checking', inventory: 'checking' });

  useEffect(() => {
    loadProducts();
    loadCart();
    checkStatus();
  }, []);

  async function checkStatus() {
    const checks = [
      ['products', '/products/actuator/health'],
      ['cart', '/cart/health'],
      ['inventory', '/inventory/health']
    ];

    const result = {};
    for (const [name, url] of checks) {
      try {
        const response = await fetch(url);
        result[name] = response.ok ? 'up' : 'down';
      } catch {
        result[name] = 'down';
      }
    }
    setApiStatus(result);
  }

  async function loadProducts() {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch(PRODUCTS_API);
      if (!response.ok) throw new Error(`Products API returned ${response.status}`);
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      setMessage(`Failed to load products: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function loadCart() {
    try {
      const response = await fetch(CART_API);
      if (!response.ok) return;
      setCart(await response.json());
    } catch {
      // frontend stays usable even if cart service is not up yet
    }
  }

  async function addToCart(product) {
    setMessage('');
    try {
      const response = await fetch(CART_ADD_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          title: product.title,
          price: product.price,
          image: product.image,
          quantity: 1
        })
      });
      const data = await readJson(response);
      if (!response.ok) throw new Error(data.error || 'Add to cart failed');
      setCart(data);
      setMessage(`${product.title} added to cart`);
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function removeFromCart(productId) {
    const response = await fetch(CART_REMOVE_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId })
    });
    if (response.ok) {
      setCart(await response.json());
    }
  }

  async function clearCart() {
    const response = await fetch(CART_CLEAR_API, { method: 'POST' });
    if (response.ok) {
      setCart(await response.json());
    }
  }

  async function checkout() {
    setMessage('');
    try {
      const response = await fetch(CHECKOUT_API, { method: 'POST' });
      const data = await readJson(response);
      if (!response.ok) throw new Error(data.error || 'Checkout failed');
      setCart({ items: [], totalQuantity: 0, totalPrice: 0 });
      setMessage(`Checkout confirmed: ${data.orderId}`);
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function checkInventory(productId) {
    try {
      const response = await fetch(`${INVENTORY_BASE}/api/inventory/${productId}`);
      const data = await readJson(response);
      if (!response.ok) throw new Error(data.error || 'Inventory API error');
      setInventory((old) => ({ ...old, [productId]: data }));
    } catch (error) {
      setInventory((old) => ({ ...old, [productId]: { error: error.message } }));
    }
  }

  const categories = useMemo(() => {
    return ['All', ...Array.from(new Set(products.map((p) => p.category))).sort()];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const categoryOk = selectedCategory === 'All' || product.category === selectedCategory;
      const query = search.trim().toLowerCase();
      const searchOk = !query || `${product.title} ${product.brand} ${product.category}`.toLowerCase().includes(query);
      return categoryOk && searchOk;
    });
  }, [products, selectedCategory, search]);

  return (
    <main className="page-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">K3s · Docker · Prometheus Lab</p>
          <h1>DevOps Laptop Store</h1>
          <p className="hero-text">
            Multi-service ecommerce demo: Java products, Node cart, Go inventory, and React frontend.
          </p>
          <div className="status-row">
            <StatusPill name="Products" status={apiStatus.products} />
            <StatusPill name="Cart" status={apiStatus.cart} />
            <StatusPill name="Inventory" status={apiStatus.inventory} />
          </div>
        </div>
        <aside className="cart-summary">
          <span>Cart</span>
          <strong>{cart.totalQuantity} items</strong>
          <strong>{money(cart.totalPrice)}</strong>
        </aside>
      </section>

      <section className="toolbar">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search laptops, keyboards, accessories..."
        />
        <div className="category-tabs">
          {categories.map((category) => (
            <button
              key={category}
              className={category === selectedCategory ? 'active' : ''}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      {message && <div className="message">{message}</div>}

      <section className="layout-grid">
        <div>
          {loading ? (
            <div className="loading-card">Loading products...</div>
          ) : (
            <div className="product-grid">
              {filteredProducts.map((product) => (
                <article className="product-card" key={product.id}>
                  <div className="product-image-wrap">
                    <img
                      src={product.image || fallbackImage}
                      alt={product.title}
                      className="product-image"
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.src = fallbackImage;
                      }}
                    />
                  </div>
                  <div className="product-body">
                    <span className="category">{product.category}</span>
                    <h2>{product.title}</h2>
                    <p>{product.description}</p>
                    <div className="meta-row">
                      <span>Brand: {product.brand}</span>
                      <span>⭐ {product.rating}</span>
                    </div>
                    <div className="meta-row">
                      <span>Stock: {product.stock}</span>
                      <button className="link-btn" onClick={() => checkInventory(product.id)}>
                        Check inventory
                      </button>
                    </div>
                    {inventory[product.id] && (
                      <div className="inventory-box">
                        {inventory[product.id].error
                          ? inventory[product.id].error
                          : `${inventory[product.id].quantity} units in ${inventory[product.id].warehouse}`}
                      </div>
                    )}
                    <div className="price-row">
                      <strong>{money(product.price)}</strong>
                      <button onClick={() => addToCart(product)}>Add to cart</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <aside className="cart-panel">
          <div className="cart-header">
            <h2>Current Cart</h2>
            <button className="ghost" onClick={clearCart}>Clear</button>
          </div>
          {cart.items.length === 0 ? (
            <p className="empty">Cart is empty.</p>
          ) : (
            <div className="cart-list">
              {cart.items.map((item) => (
                <div className="cart-item" key={item.productId}>
                  <img
                    src={item.image || fallbackImage}
                    alt={item.title}
                    onError={(event) => {
                      event.currentTarget.src = fallbackImage;
                    }}
                  />
                  <div>
                    <strong>{item.title}</strong>
                    <span>{item.quantity} × {money(item.price)}</span>
                  </div>
                  <button className="remove" onClick={() => removeFromCart(item.productId)}>×</button>
                </div>
              ))}
            </div>
          )}
          <div className="cart-total">
            <span>Total</span>
            <strong>{money(cart.totalPrice)}</strong>
          </div>
          <button className="checkout" onClick={checkout}>Checkout</button>
        </aside>
      </section>
    </main>
  );
}

function StatusPill({ name, status }) {
  return (
    <span className={`status-pill ${status}`}>
      <i /> {name}: {status}
    </span>
  );
}
