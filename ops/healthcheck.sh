#!/bin/sh

set -eu

health_url="${NEXA_HEALTH_URL:-http://127.0.0.1/health}"

exec wget \
    -q \
    -T "${NEXA_HEALTH_TIMEOUT_SECONDS:-3}" \
    -t 1 \
    -O /dev/null \
    "$health_url"
