#!/bin/sh
# Start Caddy with a login when the auth variables are set, otherwise open.
# Set BASIC_AUTH_USER plus either BASIC_AUTH_PASSWORD (hashed here at startup) or BASIC_AUTH_HASH (bcrypt).
set -eu

if [ -n "${BASIC_AUTH_USER:-}" ] && [ -z "${BASIC_AUTH_HASH:-}" ] && [ -n "${BASIC_AUTH_PASSWORD:-}" ]; then
	BASIC_AUTH_HASH="$(caddy hash-password --plaintext "$BASIC_AUTH_PASSWORD")"
	export BASIC_AUTH_HASH
fi
unset BASIC_AUTH_PASSWORD

if [ -n "${BASIC_AUTH_USER:-}" ] && [ -n "${BASIC_AUTH_HASH:-}" ]; then
	echo "Pocket Brief: login required (user ${BASIC_AUTH_USER})."
	exec caddy run --config /etc/caddy/Caddyfile.auth --adapter caddyfile
fi

echo "Pocket Brief: no login set (BASIC_AUTH_USER + BASIC_AUTH_PASSWORD), so the site is open to anyone with the link." >&2
exec caddy run --config /etc/caddy/Caddyfile --adapter caddyfile
