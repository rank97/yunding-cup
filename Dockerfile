# ==========================================
# Stage 1: Build Frontend (React + Vite)
# ==========================================
FROM node:20-alpine AS frontend-build
WORKDIR /client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# ==========================================
# Stage 2: Build Backend with Embedded Frontend Assets
# ==========================================
FROM maven:3.9.6-eclipse-temurin-17-alpine AS backend-build
WORKDIR /app
COPY server/pom.xml .
RUN mvn dependency:go-offline -B
COPY server/src ./src

# Copy frontend dist into Spring Boot static resource folder
COPY --from=frontend-build /client/dist ./src/main/resources/static/

RUN mvn clean package -DskipTests

# ==========================================
# Stage 3: Minimal Single Runtime Image (All-in-One)
# ==========================================
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# SQLite 持久化数据卷目录
VOLUME /app/data

# 拷贝构建好的全栈可执行 JAR
COPY --from=backend-build /app/target/*.jar app.jar

EXPOSE 8080
ENV SPRING_PROFILES_ACTIVE=sqlite

ENTRYPOINT ["java", "-jar", "app.jar"]
