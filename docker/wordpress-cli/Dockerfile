FROM node:22-alpine AS node

FROM wordpress:cli

ARG IMAGE_VERSION=1.1.0

ARG USER=www-data

USER root

# Install node from the official node image
COPY --from=node /usr/lib /usr/lib
COPY --from=node /usr/local/lib /usr/local/lib
COPY --from=node /usr/local/include /usr/local/include
COPY --from=node /usr/local/bin /usr/local/bin
RUN npm install -g yarn --force
RUN npm install -g pnpm --force

RUN apk --no-cache add pcre-dev linux-headers ${PHPIZE_DEPS}
RUN pecl install xdebug && docker-php-ext-enable xdebug
RUN apk del pcre-dev ${PHPIZE_DEPS}

RUN apk add subversion

# configure xdebug
RUN echo "xdebug.mode=${XDEBUG_MODE:-off}" >> /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini
RUN echo "xdebug.start_with_request=yes" >> /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini
RUN echo "xdebug.client_host=host.docker.internal" >> /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini

COPY --from=composer:latest /usr/bin/composer /usr/local/bin/composer
# Allow global packages from arbitrary docker users
COPY composer/ /composer/
RUN cd /composer && composer install
RUN chmod -R 777 /composer
ENV COMPOSER_HOME=/composer
ENV PATH="${PATH}:/composer/vendor/bin"

RUN mkdir /wordpress-tests-lib && chmod 777 /wordpress-tests-lib
ENV WP_TESTS_DIR=/wordpress-tests-lib

RUN mkdir -p /etc/X11/fs/.wp-cli/ && chmod -R 777 /etc/X11/fs/.wp-cli/

COPY install-wp-tests.sh /usr/local/bin/
COPY wordpress-tests-lib /wordpress-tests-lib
RUN chmod -R 777 /wordpress-tests-lib
RUN mv /usr/local/bin/install-wp-tests.sh /usr/local/bin/install-wp-tests
RUN chmod +x /usr/local/bin/install-wp-tests

# Create a single home directory for all users
RUN mkdir -p /home/guest && chmod 777 /home/guest
ENV HOME=/home/guest

USER ${USER}
