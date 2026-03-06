# ============================================================
# Dockerfile for auth-service (multi-stage build)
# ============================================================
# Multi-stage builds use two stages:
#   1. BUILD stage  — compiles the Java code into a .jar file
#   2. RUN stage    — runs the .jar in a lightweight JRE image
# This keeps the final image small (no Maven/JDK, just the JRE).
# ============================================================

# ---------- Stage 1: BUILD ----------
# Use a Maven image with Java 25 to compile the project
FROM maven:3-eclipse-temurin-25-noble AS build
WORKDIR /app

# Copy the Maven config (pom.xml) and source code into the container
COPY pom.xml .
COPY src ./src

# Build the project and create a .jar file (skip tests to speed up build)
RUN mvn -q -DskipTests package

# ---------- Stage 2: RUN ----------
# Use a smaller JRE-only image (no compiler needed at runtime)
FROM eclipse-temurin:25-jre
WORKDIR /app

# Copy the compiled .jar from the build stage
COPY --from=build /app/target/*.jar app.jar

# Document that this container listens on port 8081
EXPOSE 8081

# Start the Spring Boot application
ENTRYPOINT ["java","-jar","app.jar"]
