# 🐳 Contenedor Docker — VitalTrace App Web

Contenedor de **producción** para la app web (Vue 3 + Vite). Compila el
proyecto y sirve el `dist/` con **Nginx**, que además actúa como **proxy
inverso** hacia la API. Cumple dos entregables de la rúbrica a la vez:
**#4 Contenedores (Docker)** y **#3 Proxy inverso (Nginx)**.

---

## Dónde van los archivos

Coloca estos 4 archivos en la **raíz del repo `vitaltrace-frontend`**
(junto a `package.json`):

```
vitaltrace-frontend/
├── Dockerfile
├── nginx.conf
├── .dockerignore
├── docker-compose.yml
├── package.json
├── src/
└── ...
```

---

## Cómo construir y correr

Necesitas Docker instalado. Desde la raíz del repo:

### Opción A — con docker compose (recomendado)

```bash
docker compose up -d --build
```

Abre: **http://localhost:8080**

Para detener:

```bash
docker compose down
```

### Opción B — con docker a secas

```bash
# construir la imagen
docker build -t vitaltrace-web:latest .

# correr el contenedor
docker run -d --name vitaltrace-web -p 8080:80 vitaltrace-web:latest
```

---

## Cómo funciona (multi-stage)

1. **Etapa build** (`node:20-alpine`): instala dependencias con `npm ci`,
   inyecta `VITE_API_URL` y ejecuta `npm run build` → genera `dist/`.
2. **Etapa runtime** (`nginx:1.27-alpine`): copia solo el `dist/` y la
   config de Nginx. La imagen final **no lleva Node ni node_modules**, solo
   Nginx + los estáticos → imagen pequeña y segura.

Nginx dentro del contenedor:
- Sirve la SPA con fallback a `index.html` (Vue Router funciona en recarga).
- Comprime con **gzip** (app liviana al cliente).
- Cachea los activos con hash por 1 año; no cachea `index.html`.
- Hace **proxy_pass** de `/api/` hacia `https://api.vitaltrace.lat` (listo
  por si la app usa rutas relativas; hoy llama directo, así que es opcional).
- Agrega cabeceras básicas de seguridad.

---

## Cambiar la URL de la API

La URL se fija al construir. Para apuntar a otra:

```bash
docker build --build-arg VITE_API_URL=https://otra-api.vitaltrace.lat -t vitaltrace-web:latest .
```

O edita `docker-compose.yml` → `args: VITE_API_URL`.

---

## Verificar que quedó bien

```bash
# ver el contenedor corriendo y su estado de salud
docker ps

# ver logs de Nginx
docker logs vitaltrace-web

# probar que responde
curl -I http://localhost:8080
```

Debe devolver `HTTP/1.1 200 OK` y, en las cabeceras de un `.js`,
`Content-Encoding: gzip`.

---

## Cómo defenderlo ante el jurado

> "La app web se empaqueta en un contenedor Docker con build multi-stage:
> una etapa compila el proyecto con Node y otra sirve el resultado con Nginx.
> La imagen final solo contiene Nginx y los estáticos, por lo que es liviana
> y reduce la superficie de ataque. Nginx actúa como proxy inverso: recibe
> el tráfico, sirve la SPA comprimida con gzip y puede reenviar `/api` al
> backend. Esto cumple tanto el entregable de contenedores como el de proxy
> inverso, con aislamiento real del entorno de ejecución."

---

## Nota sobre los secretos

El `.dockerignore` excluye el `.env`, así que **ningún secreto entra a la
imagen**. En el frontend, la única variable es `VITE_API_URL` (una URL
pública), que se inyecta en build. Nunca pongas claves en variables `VITE_`,
porque quedan en el bundle público.
