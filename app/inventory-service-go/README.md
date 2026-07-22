# Inventory Service (Go)

This service exposes inventory information for products used by the ecommerce frontend.

## What it does
- Returns inventory data for a specific product ID
- Provides a health check endpoint
- Exposes Prometheus metrics at `/metrics`

## Prerequisites
- Go 1.23 or newer

## Install locally
```bash
cd app/inventory-service-go
go mod download
```

## Run locally
```bash
go run .
```

The service runs by default on port `8083`.

## Useful endpoints
- `GET /health`
- `GET /api/inventory/{productId}`
- `GET /metrics`

## Environment variables
- `PORT`: override the default listening port (default: `8083`)
