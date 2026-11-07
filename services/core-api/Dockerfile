FROM php:8.3-fpm-alpine

# Descargar instalador de extensiones precompiladas oficial
ADD --chmod=0755 https://github.com/mlocati/docker-php-extension-installer/releases/latest/download/install-php-extensions /usr/local/bin/

# Instalar pdo_pgsql, zip y utilidades básicas sin compilar LLVM/Clang
RUN apk add --no-cache bash git curl && \
    install-php-extensions pdo_pgsql zip

# Composer oficial
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html