# Build the frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY package.json package-lock.json* ./
COPY tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts postcss.config.js tailwind.config.js ./
COPY public ./public
COPY src ./src
RUN npm install
RUN npm run build

# Build the backend
FROM node:20-alpine AS backend-build
WORKDIR /app/server
COPY server/package.json server/package-lock.json* ./
RUN npm install
COPY server/tsconfig.json ./
COPY server/src ./src
COPY server/prisma ./prisma
RUN npm run build

# Final runtime image
FROM node:20-alpine AS runtime
WORKDIR /app

# Copy backend build output and node_modules
COPY --from=backend-build /app/server/dist ./server/dist
COPY --from=backend-build /app/server/node_modules ./server/node_modules
COPY server/package.json ./server/package.json

# Copy frontend build output
COPY --from=frontend-build /app/dist ./dist

ENV NODE_ENV=production
WORKDIR /app/server
EXPOSE 5000
CMD ["node", "dist/index.js"]
