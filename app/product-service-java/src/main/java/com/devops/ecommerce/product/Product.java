package com.devops.ecommerce.product;

public class Product {
    private Long id;
    private String title;
    private String brand;
    private String category;
    private double price;
    private int stock;
    private double rating;
    private String image;
    private String description;

    public Product() {
    }

    public Product(Long id, String title, String brand, String category, double price, int stock, double rating, String image, String description) {
        this.id = id;
        this.title = title;
        this.brand = brand;
        this.category = category;
        this.price = price;
        this.stock = stock;
        this.rating = rating;
        this.image = image;
        this.description = description;
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getBrand() {
        return brand;
    }

    public String getCategory() {
        return category;
    }

    public double getPrice() {
        return price;
    }

    public int getStock() {
        return stock;
    }

    public double getRating() {
        return rating;
    }

    public String getImage() {
        return image;
    }

    public String getDescription() {
        return description;
    }
}
