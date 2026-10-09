# ============================================================
# VitalTrace - App Web (Vue 3 + Vite)
# Dockerfile multi-stage: compila con Node, sirve con Nginx.
# Imagen final liviana (solo Nginx + estáticos, sin Node).
# ============================================================

# ---------- Etapa 1: build ----------
FROM node:20-alpine AS build

WORKDIR /app

# Instalar dependencias primero (aprovecha la caché de capas)
COPY package*.json ./
RUN npm ci

# Copiar el resto del código y compilar
COPY . .

# URL de la API en tiempo de build (se puede sobrescribir al construir:
#   docker build --build-arg VITE_API_URL=https://api.vitaltrace.lat ... )
ARG VITE_API_URL=https://api.vitaltrace.lat
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ---------- Etapa 2: runtime ----------
FROM nginx:1.27-alpine AS runtime

# Config de Nginx para SPA + gzip + proxy /api
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los estáticos compilados desde la etapa de build
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

# Healthcheck simple: que Nginx responda
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost/ >/dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]
