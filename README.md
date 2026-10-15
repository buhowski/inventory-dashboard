# Stockroom

Demo: 

## Run locally

Requirements: Node.js 24 and Yarn 1.22.22.

```sh
yarn install --frozen-lockfile
yarn dev:all
```

Open [http://localhost:3000](http://localhost:3000). The Socket.IO server uses port `3001`.
Alternatively, run `yarn dev` and `yarn dev:socket` in separate terminals.

## Run with Docker

Copy `.env.example` to `.env` and replace the sample passwords, then run:

```sh
docker compose up --build
```

The app is available on port `3000`, Socket.IO on `3001`, and MySQL on `3306`.
The MySQL schema is initialized from `database/schema.sql`. The app currently uses in-memory demo data; its API is not connected to MySQL.

## Checks

```sh
yarn lint
yarn typecheck
yarn test
yarn build
```

## Structure

```text
inventory-dashboard/
├── database/
│   └── schema.sql            # MySQL schema for orders, products, and prices
├── Dockerfile                # Multi-stage Docker image for the app
├── docker-compose.yml        # Compose configuration for app + Socket.IO + MySQL
├── public/
│   ├── icon.svg              # App icon
│   ├── manifest.webmanifest  # PWA manifest
│   ├── offline.html          # Offline fallback page
│   └── sw.js                 # Service worker
├── server/
│   └── socket.ts             # Socket.IO server for the active-tab counter
├── src/
│   ├── app/                  # Next.js routes, API handlers, and layouts
│   ├── components/           # Shared UI and page components
│   ├── lib/                  # Redux store, inventory data, and helpers
│   └── styles/               # SCSS styles and design tokens
├── .env.example              # Example environment variables
├── .dockerignore             # Docker build exclusions
├── .gitignore                # Git ignore rules
├── eslint.config.mjs         # ESLint configuration
├── next.config.ts            # Next.js configuration
├── package.json              # Dependencies and scripts
├── README.md                 # Project documentation
├── tsconfig.json             # TypeScript configuration
├── vitest.config.mts         # Vitest configuration
└── yarn.lock                 # Dependency lockfile
```