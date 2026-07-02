FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json ./
RUN pnpm install --prod=false

FROM deps AS build
COPY tsconfig.json ./
COPY src ./src
RUN pnpm build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable
COPY package.json ./
RUN pnpm install --prod
COPY --from=build /app/dist ./dist
RUN mkdir -p data uploads
EXPOSE 4000
CMD ["node", "dist/src/server.js"]
