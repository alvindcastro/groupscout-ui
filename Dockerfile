FROM node:22-bookworm-slim AS test

WORKDIR /workspace
ENV NODE_ENV=test

COPY package.json ./
COPY web ./web
COPY test ./test
COPY Dockerfile ./
COPY .dockerignore ./
COPY compose.dev.yml ./

CMD ["npm", "test"]

FROM test AS production

ENV NODE_ENV=production
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=5s --retries=5 --start-period=5s CMD node -e "fetch('http://127.0.0.1:3000/healthz').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["npm", "run", "start:ui"]
