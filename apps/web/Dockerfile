FROM node:22-alpine AS builder
WORKDIR /app
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NODE_OPTIONS="--max-old-space-size=1024"
COPY package*.json ./
RUN npm ci && \
    sed -i "s/Chrome\/104\.0\.0\.0/Chrome\/130.0.0.0/g" node_modules/next/dist/compiled/@next/font/dist/google/fetch-css-from-google-fonts.js && \
    sed -i "s/\.exec(googleFontFileUrl)\[1\]/.exec(googleFontFileUrl)?.[1] ?? 'woff2'/" node_modules/next/dist/compiled/@next/font/dist/google/loader.js
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=384"
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
