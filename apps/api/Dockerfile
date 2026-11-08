FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=384"
COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/database ./database
EXPOSE 4000
CMD ["sh", "-c", "./node_modules/.bin/node-pg-migrate up --migrations-dir database/migrations --database-url-var DATABASE_URL_DIRECT && node dist/main"]
