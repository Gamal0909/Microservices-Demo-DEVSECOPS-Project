# Product Service (Java / Spring Boot)

This service serves the product catalog used by the ecommerce frontend.

## What it does
- Returns all products
- Returns product details by ID
- Returns available categories
- Exposes health and Prometheus metrics endpoints

## Prerequisites
- Java 17 or newer
- Maven

## Install locally
```bash
cd app/product-service-java
mvn clean install
```

## Run locally
```bash
mvn spring-boot:run
```

The service runs by default on port `8081`.

## Useful endpoints
- `GET /api/products`
- `GET /api/products/{id}`
- `GET /api/categories`
- `GET /actuator/health`
- `GET /actuator/prometheus`

## Environment variables
- `SERVER_PORT`: override the default listening port (default: `8081`)
