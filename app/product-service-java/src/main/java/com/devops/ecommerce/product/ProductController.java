package com.devops.ecommerce.product;

import java.util.List;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class ProductController {
    private final ProductRepository repository;
    private final Counter productListRequests;
    private final Counter productDetailsRequests;
    private final Counter categoryRequests;

    public ProductController(ProductRepository repository, MeterRegistry meterRegistry) {
        this.repository = repository;
        this.productListRequests = Counter.builder("ecommerce_product_list_requests_total")
            .description("Total number of product list requests")
            .register(meterRegistry);
        this.productDetailsRequests = Counter.builder("ecommerce_product_details_requests_total")
            .description("Total number of product details requests")
            .register(meterRegistry);
        this.categoryRequests = Counter.builder("ecommerce_product_category_requests_total")
            .description("Total number of category list requests")
            .register(meterRegistry);
    }

    @GetMapping("/products")
    public List<Product> getProducts() {
        productListRequests.increment();
        return repository.findAll();
    }

    @GetMapping("/products/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable Long id) {
        productDetailsRequests.increment();
        return repository.findById(id)
            .map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/categories")
    public List<String> getCategories() {
        categoryRequests.increment();
        return repository.findCategories();
    }
}
