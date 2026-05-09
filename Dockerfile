FROM node:22-bookworm-slim AS test

WORKDIR /workspace
ENV NODE_ENV=test

COPY package.json ./
COPY DESIGN.md ./
COPY docs ./docs
COPY web ./web
COPY test ./test
COPY Dockerfile ./
COPY .dockerignore ./
COPY compose.dev.yml ./

CMD ["npm", "test"]
