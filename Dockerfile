# syntax=docker/dockerfile:1

# --- build stage: compile TypeScript -> dist/ ---
FROM node:20-slim AS build
WORKDIR /app

# Install all deps (incl. devDeps for tsc). --ignore-scripts so the `prepare`
# hook does not try to build before sources are copied.
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . .
RUN npm run build

# --- runtime stage: production deps + compiled output only ---
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Production dependencies only. @hono/node-server (used by the SDK's Streamable
# HTTP transport) is a transitive prod dep and is included.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

COPY --from=build /app/dist ./dist

# Railway injects PORT at runtime; the server falls back to 3000 locally.
EXPOSE 3000

# Remote HTTP entrypoint (NOT the stdio entrypoint).
CMD ["node", "dist/http.js"]
