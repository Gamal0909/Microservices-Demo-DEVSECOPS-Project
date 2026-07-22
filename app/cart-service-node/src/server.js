import express from 'express';
import cors from 'cors';
import client from 'prom-client';

const app = express();
const PORT = Number(process.env.PORT || 8082);

app.use(cors());
app.use(express.json());

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequestsTotal = new client.Counter({
  name: 'ecommerce_cart_http_requests_total',
  help: 'Total HTTP requests handled by cart-service-node',
  labelNames: ['method', 'route', 'status_code']
});

const httpRequestDurationSeconds = new client.Histogram({
  name: 'ecommerce_cart_http_request_duration_seconds',
  help: 'HTTP request duration in seconds for cart-service-node',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5]
});

const cartItemsGauge = new client.Gauge({
  name: 'ecommerce_cart_items_current',
  help: 'Current number of line items in the cart'
});

const checkoutTotal = new client.Counter({
  name: 'ecommerce_cart_checkouts_total',
  help: 'Total completed checkout requests'
});

register.registerMetric(httpRequestsTotal);
register.registerMetric(httpRequestDurationSeconds);
register.registerMetric(cartItemsGauge);
register.registerMetric(checkoutTotal);

const cart = new Map();

function cartAsArray() {
  return Array.from(cart.values());
}

function cartSummary() {
  const items = cartAsArray();
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  cartItemsGauge.set(items.length);
  return {
    items,
    totalQuantity,
    totalPrice: Number(totalPrice.toFixed(2))
  };
}

app.use((req, res, next) => {
  const endTimer = httpRequestDurationSeconds.startTimer();
  res.on('finish', () => {
    if (req.path === '/metrics') return;
    const route = req.route && req.route.path ? req.route.path : req.path;
    const labels = {
      method: req.method,
      route,
      status_code: String(res.statusCode)
    };
    httpRequestsTotal.inc(labels);
    endTimer(labels);
  });
  next();
});

app.get('/health', (req, res) => {
  res.json({ status: 'UP', service: 'cart-service-node' });
});

app.get('/api/cart', (req, res) => {
  res.json(cartSummary());
});

app.post('/api/cart/add', (req, res) => {
  const { productId, title, price, image, quantity } = req.body;

  if (!productId || !title || typeof price !== 'number') {
    return res.status(400).json({
      error: 'productId, title and numeric price are required'
    });
  }

  const safeQuantity = Number.isInteger(quantity) && quantity > 0 ? quantity : 1;
  const id = String(productId);
  const existing = cart.get(id);

  if (existing) {
    existing.quantity += safeQuantity;
    cart.set(id, existing);
  } else {
    cart.set(id, {
      productId,
      title,
      price,
      image: image || '',
      quantity: safeQuantity
    });
  }

  res.status(201).json(cartSummary());
});

app.post('/api/cart/remove', (req, res) => {
  const { productId } = req.body;
  if (!productId) {
    return res.status(400).json({ error: 'productId is required' });
  }
  cart.delete(String(productId));
  res.json(cartSummary());
});

app.post('/api/cart/clear', (req, res) => {
  cart.clear();
  res.json(cartSummary());
});

app.post('/api/checkout', (req, res) => {
  const summary = cartSummary();
  if (summary.items.length === 0) {
    return res.status(400).json({ error: 'cart is empty' });
  }

  const order = {
    orderId: `ORD-${Date.now()}`,
    status: 'CONFIRMED',
    ...summary
  };

  checkoutTotal.inc();
  cart.clear();
  cartItemsGauge.set(0);

  res.status(201).json(order);
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`cart-service-node is running on port ${PORT}`);
});
