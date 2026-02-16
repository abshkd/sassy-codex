FROM node:24-alpine
WORKDIR /app

ENV CI=true

COPY . .
RUN corepack enable && pnpm install

CMD ["pnpm","--filter","web","start"]
