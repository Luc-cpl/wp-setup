FROM wordpress:cli

ARG USER=www-data

USER root

RUN apk add subversion

RUN addgroup www-data xfs

RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
# Allow global packages from arbitrary docker users
RUN mkdir /.composer && chmod -R 777 /.composer
ENV PATH="${PATH}:/.composer/vendor/bin"
ENV PATH="${PATH}:/home/www-data/.composer/vendor/bin"

RUN mkdir /wordpress-tests-lib && chmod 777 /wordpress-tests-lib
ENV WP_TESTS_DIR=/wordpress-tests-lib

RUN mkdir -p /etc/X11/fs/.wp-cli/ && chmod -R 777 /etc/X11/fs/.wp-cli/

COPY install-wp-tests.sh /usr/local/bin/
COPY wordpress-tests-lib /wordpress-tests-lib
RUN chmod -R 777 /wordpress-tests-lib
RUN mv /usr/local/bin/install-wp-tests.sh /usr/local/bin/install-wp-tests
RUN chmod +x /usr/local/bin/install-wp-tests

USER ${USER}
