FROM dunglas/frankenphp:php8.4

ARG IMAGE_VERSION=1.1.0

# install the PHP extensions we need (https://make.wordpress.org/hosting/handbook/handbook/server-environment/#php-extensions)
RUN install-php-extensions \
    bcmath \
    exif \
    gd \
    intl \
    mysqli \
    zip \
    imagick \
    opcache \
    xdebug

# configure xdebug
RUN echo "xdebug.mode=off" >> /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini
RUN echo "xdebug.start_with_request=yes" >> /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini
RUN echo "xdebug.client_host=\${XDEBUG_CLIENT_HOST}" >> /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini
RUN echo "xdebug.discover_client_host=\${XDEBUG_DISCOVERY_CLIENT_HOST}" >> /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini

COPY --from=wordpress /usr/local/etc/php/conf.d/* /usr/local/etc/php/conf.d/
COPY --from=wordpress /usr/local/bin/docker-entrypoint.sh /usr/local/bin/
COPY --from=wordpress --chown=root:root /usr/src/wordpress /usr/src/wordpress

RUN chown -R root:root /data/caddy /config/caddy && chmod -R 777 /data/caddy /config/caddy

WORKDIR /var/www/html
VOLUME /var/www/html

ARG USER=www-data

RUN sed -i \
    -e 's/\[ "$1" = "php-fpm" \]/\[\[ "$1" == frankenphp* \]\]/g' \
    -e 's/php-fpm/frankenphp/g' \
    /usr/local/bin/docker-entrypoint.sh

COPY Caddyfile /etc/caddy/

USER ${USER}
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["frankenphp", "run", "--config", "/etc/caddy/Caddyfile"]