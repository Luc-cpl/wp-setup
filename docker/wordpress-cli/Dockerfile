FROM wordpress:cli

ARG USER=www-data

USER root

RUN addgroup www-data xfs

RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

RUN mkdir -p /etc/X11/fs/.wp-cli/ && chmod -R 777 /etc/X11/fs/.wp-cli/

USER ${USER}
