FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build -- --configuration production

FROM nginx:1.29-alpine

COPY ops/nginx.conf /etc/nginx/conf.d/default.conf
COPY ops/healthcheck.sh /usr/local/bin/nexa-healthcheck
COPY --from=build /app/dist/nexa-platform/browser /usr/share/nginx/html

RUN chmod 0755 /usr/local/bin/nexa-healthcheck

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=5s --start-period=5s --retries=12 \
    CMD ["/usr/local/bin/nexa-healthcheck"]

CMD ["nginx", "-g", "daemon off;"]
