# T20: image FE DACN = file tĩnh (vite build) phục vụ bằng Caddy, kiêm reverse proxy /web/* → API.
# Build từ thư mục gốc repo FE (compose trong DACN_Project/deploy gọi build này).

FROM node:22-alpine AS build
WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM caddy:2-alpine
COPY deploy/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /src/dist /srv
