# Cart Service (Node.js)

This service provides the shopping cart API for the ecommerce demo.

## What it does
- Exposes cart endpoints for viewing, adding, removing, and clearing items
- Supports checkout and returns an order summary
- Exposes Prometheus metrics at `/metrics`
- Includes a `/health` endpoint for health checks

## Prerequisites
- Node.js 20 or newer
- npm

## Install locally
```bash
cd app/cart-service-node
npm install
```

## Run locally
### Production mode
```bash
npm start
```

### Development mode with auto-reload
```bash
npm run dev
```

The service runs by default on port `8082`.

## Useful endpoints
- `GET /health`
- `GET /api/cart`
- `POST /api/cart/add`
- `POST /api/cart/remove`
- `POST /api/cart/clear`
- `POST /api/checkout`
- `GET /metrics`

## Environment variables
- `PORT`: override the default listening port (default: `8082`)
