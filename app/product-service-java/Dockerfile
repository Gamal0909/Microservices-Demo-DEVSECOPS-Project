FROM maven:3.9.4-eclipse-temurin-20-alpine AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -q -DskipTests dependency:go-offline
COPY src ./src
RUN mvn -q -DskipTests package

FROM eclipse-temurin:20-alpine
WORKDIR /app
RUN apk add --no-cache curl && addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=build /app/target/product-service-*.jar ./product-service.jar
RUN chown appuser:appgroup /app/product-service.jar
USER appuser

EXPOSE 8081

CMD ["java", "-jar", "product-service.jar"]