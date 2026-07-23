FROM golang:1.23-alpine AS build

WORKDIR /app

COPY go.mod go.sum* ./

RUN go mod download

COPY . .
RUN go mod tidy
RUN CGO_ENABLED=0 GOOS=linux go build -o inventory-service .

FROM alpine:3.20

WORKDIR /app

RUN apk add --no-cache curl && addgroup -S appgroup && adduser -S appuser -G appgroup 

COPY --from=build /app/inventory-service .
RUN chown appuser:appgroup /app/inventory-service
USER appuser

EXPOSE 8083

CMD ["./inventory-service"]