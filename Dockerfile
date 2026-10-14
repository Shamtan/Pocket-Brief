# Pocket Brief: the static brief served by Caddy. Railway builds and runs this image.
FROM caddy:2-alpine

COPY deploy/site.caddy deploy/Caddyfile deploy/Caddyfile.auth /etc/caddy/
COPY deploy/start.sh /usr/local/bin/start.sh
COPY web/ /srv/
COPY data/ /srv/data/
RUN chmod 755 /usr/local/bin/start.sh

# Railway injects PORT at runtime; 8080 is the local default.
ENV PORT=8080
EXPOSE 8080
CMD ["/usr/local/bin/start.sh"]
