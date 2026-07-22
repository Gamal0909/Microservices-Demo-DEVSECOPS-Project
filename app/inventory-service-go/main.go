package main

import (
    "encoding/json"
    "log"
    "net/http"
    "os"
    "strings"
    "time"

    "github.com/prometheus/client_golang/prometheus"
    "github.com/prometheus/client_golang/prometheus/promauto"
    "github.com/prometheus/client_golang/prometheus/promhttp"
)

type InventoryItem struct {
    ProductID string `json:"productId"`
    Available bool   `json:"available"`
    Quantity  int    `json:"quantity"`
    Warehouse string `json:"warehouse"`
}

var inventory = map[string]InventoryItem{
    "1":  {ProductID: "1", Available: true, Quantity: 12, Warehouse: "lab-a"},
    "2":  {ProductID: "2", Available: true, Quantity: 8, Warehouse: "lab-a"},
    "3":  {ProductID: "3", Available: true, Quantity: 15, Warehouse: "lab-b"},
    "4":  {ProductID: "4", Available: true, Quantity: 6, Warehouse: "lab-b"},
    "5":  {ProductID: "5", Available: true, Quantity: 10, Warehouse: "gaming-zone"},
    "6":  {ProductID: "6", Available: true, Quantity: 31, Warehouse: "accessories"},
    "7":  {ProductID: "7", Available: true, Quantity: 20, Warehouse: "accessories"},
    "8":  {ProductID: "8", Available: true, Quantity: 26, Warehouse: "accessories"},
    "9":  {ProductID: "9", Available: true, Quantity: 18, Warehouse: "displays"},
    "10": {ProductID: "10", Available: true, Quantity: 11, Warehouse: "audio"},
    "11": {ProductID: "11", Available: true, Quantity: 42, Warehouse: "accessories"},
    "12": {ProductID: "12", Available: true, Quantity: 24, Warehouse: "storage"},
}

var requestsTotal = promauto.NewCounterVec(
    prometheus.CounterOpts{
        Name: "ecommerce_inventory_http_requests_total",
        Help: "Total HTTP requests handled by inventory-service-go",
    },
    []string{"method", "path", "status"},
)

var requestDuration = promauto.NewHistogramVec(
    prometheus.HistogramOpts{
        Name:    "ecommerce_inventory_http_request_duration_seconds",
        Help:    "HTTP request duration in seconds for inventory-service-go",
        Buckets: []float64{0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5},
    },
    []string{"method", "path", "status"},
)

func writeJSON(w http.ResponseWriter, status int, payload any) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    if err := json.NewEncoder(w).Encode(payload); err != nil {
        log.Printf("failed to encode response: %v", err)
    }
}

func metricsMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        if r.URL.Path == "/metrics" {
            next.ServeHTTP(w, r)
            return
        }

        start := time.Now()
        rw := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}
        next.ServeHTTP(rw, r)

        status := http.StatusText(rw.statusCode)
        if status == "" {
            status = "unknown"
        }
        path := r.URL.Path
        requestsTotal.WithLabelValues(r.Method, path, status).Inc()
        requestDuration.WithLabelValues(r.Method, path, status).Observe(time.Since(start).Seconds())
    })
}

type responseWriter struct {
    http.ResponseWriter
    statusCode int
}

func (rw *responseWriter) WriteHeader(code int) {
    rw.statusCode = code
    rw.ResponseWriter.WriteHeader(code)
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
    writeJSON(w, http.StatusOK, map[string]string{
        "status":  "UP",
        "service": "inventory-service-go",
    })
}

func inventoryHandler(w http.ResponseWriter, r *http.Request) {
    productID := strings.TrimPrefix(r.URL.Path, "/api/inventory/")
    if productID == "" || productID == r.URL.Path {
        writeJSON(w, http.StatusBadRequest, map[string]string{"error": "product id is required"})
        return
    }

    item, ok := inventory[productID]
    if !ok {
        writeJSON(w, http.StatusNotFound, map[string]string{"error": "inventory item not found"})
        return
    }

    writeJSON(w, http.StatusOK, item)
}

func main() {
    port := os.Getenv("PORT")
    if port == "" {
        port = "8083"
    }

    mux := http.NewServeMux()
    mux.HandleFunc("/health", healthHandler)
    mux.HandleFunc("/api/inventory/", inventoryHandler)
    mux.Handle("/metrics", promhttp.Handler())

    server := &http.Server{
        Addr:              ":" + port,
        Handler:           metricsMiddleware(mux),
        ReadHeaderTimeout: 5 * time.Second,
    }

    log.Printf("inventory-service-go is running on port %s", port)
    if err := server.ListenAndServe(); err != nil {
        log.Fatal(err)
    }
}
