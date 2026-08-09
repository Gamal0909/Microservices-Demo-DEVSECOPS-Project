package com.devops.ecommerce.product;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Repository;

@Repository
public class ProductRepository {
    private final List<Product> products = List.of(
        new Product(1L, "Lenovo ThinkPad E14", "Lenovo", "Laptops", 750, 12, 4.7,
            "/images/products/thinkpad-e14.svg",
            "Business laptop with Ryzen CPU, 16GB RAM and fast SSD."),
        new Product(2L, "Dell Latitude 5440", "Dell", "Laptops", 820, 8, 4.6,
            "/images/products/dell-latitude.svg",
            "Durable office laptop designed for daily productivity."),
        new Product(3L, "HP ProBook 450", "HP", "Laptops", 680, 15, 4.4,
            "/images/products/hp-probook.svg",
            "Reliable business notebook with modern security features."),
        new Product(4L, "MacBook Air M2", "Apple", "Laptops", 1150, 6, 4.9,
            "/images/products/macbook-air.svg",
            "Thin and silent laptop with Apple Silicon performance."),
        new Product(5L, "ASUS TUF Gaming A15", "ASUS", "Gaming", 990, 10, 4.5,
            "/images/products/asus-tuf.svg",
            "Gaming laptop with RTX graphics and high refresh display."),
        new Product(6L, "Logitech MX Keys", "Logitech", "Keyboards", 120, 31, 4.8,
            "/images/products/mx-keys.svg",
            "Premium wireless keyboard for developers and creators."),
        new Product(7L, "Razer BlackWidow V4", "Razer", "Keyboards", 160, 20, 4.5,
            "/images/products/razer-keyboard.svg",
            "Mechanical gaming keyboard with tactile switches."),
        new Product(8L, "Logitech MX Master 3S", "Logitech", "Mice", 95, 26, 4.8,
            "/images/products/mx-master.svg",
            "Ergonomic wireless mouse with precise scrolling."),
        new Product(9L, "Samsung 27 inch Monitor", "Samsung", "Monitors", 210, 18, 4.3,
            "/images/products/samsung-monitor.svg",
            "Full HD monitor for workstations and home office setups."),
        new Product(10L, "Sony WH-1000XM5", "Sony", "Headphones", 330, 11, 4.9,
            "/images/products/sony-headphones.svg",
            "Noise cancelling headphones with long battery life."),
        new Product(11L, "USB-C Hub 7-in-1", "Anker", "Accessories", 45, 42, 4.2,
            "/images/products/usb-c-hub.svg",
            "Compact hub with HDMI, USB, SD card and Power Delivery."),
        new Product(12L, "Samsung 1TB Portable SSD", "Samsung", "Storage", 110, 24, 4.7,
            "/images/products/portable-ssd.svg",
            "Fast external SSD for backups, games and media projects.")
    );

    public List<Product> findAll() {
        return products.stream()
            .sorted(Comparator.comparing(Product::getId))
            .toList();
    }

    public Optional<Product> findById(Long id) {
        return products.stream()
            .filter(product -> product.getId().equals(id))
            .findFirst();
    }

    public List<String> findCategories() {
        return products.stream()
            .map(Product::getCategory)
            .distinct()
            .sorted()
            .toList();
    }
}
