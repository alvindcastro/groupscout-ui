FROM node:22.23.3-bookworm-slim AS test

WORKDIR /workspace
ENV NODE_ENV=test

COPY package.json ./
COPY web ./web
COPY test ./test
COPY Dockerfile ./
COPY .dockerignore ./
COPY compose.dev.yml ./

CMD ["npm", "test"]

# Production starts from a clean base so tests, Compose files and the
# Dockerfile itself never ship in the runtime image.
FROM node:22.23.3-bookworm-slim AS production

WORKDIR /workspace
ENV NODE_ENV=production

COPY package.json ./
COPY web ./web

USER node
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=5s --retries=5 --start-period=5s CMD node -e "fetch('http://127.0.0.1:3000/healthz').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["npm", "run", "start:ui"]
