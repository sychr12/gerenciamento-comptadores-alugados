FROM php:8.3-apache

RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq-dev libsnmp-dev \
    && docker-php-ext-install pdo_pgsql snmp \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /var/www/html
COPY --chown=www-data:www-data gerenciador3/ /var/www/html/

EXPOSE 80
