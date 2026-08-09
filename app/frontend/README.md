# Frontend (React + Vite)

This is the ecommerce web UI for the demo application.

## What it does
- Displays the product catalog
- Lets users add items to the cart
- Calls the product, cart, and inventory services
- Runs locally with Vite and proxies API requests to the backend services

## Prerequisites
- Node.js 20 or newer
- npm

## Install locally
```bash
cd app/frontend
npm install
```

## Run locally
```bash
npm run dev
```

The frontend runs by default at:
- `http://localhost:5173`

## Local service expectations
The Vite dev server proxies these paths to the local services:
- `/products` → `http://localhost:8081`
- `/cart` → `http://localhost:8082`
- `/inventory` → `http://localhost:8083`

## Notes
Make sure the product, cart, and inventory services are running before opening the frontend.
