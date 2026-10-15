FROM node:24-alpine AS dependencies
WORKDIR /app
RUN corepack enable
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable

COPY --from=dependencies /app/node_modules ./node_modules
COPY package.json yarn.lock ./
COPY next.config.ts tsconfig.json ./
COPY next-env.d.ts ./
COPY src ./src
COPY server ./server
COPY public ./public

RUN yarn build

EXPOSE 3000 3001
CMD ["yarn", "start:all"]
