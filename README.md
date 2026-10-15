# Stockroom

Demo: https://inventory-dashboard-case.vercel.app

Note: Socket.IO is fully testable locally (Vercel doesn't support it).

## Run locally

Requirements:
- Node.js 24
- Yarn / npm

### Install:

```sh
# Yarn
yarn install --frozen-lockfile

# Or npm
npm ci
```

### Start App and Socket.IO server:

```sh
# Yarn
yarn dev:all

# npm
npm run dev:all
```

Open [http://localhost:3000](http://localhost:3000). 

The app is available on port `3000`, Socket.IO on `3001`, MySQL on `3306`.

To run services separately:

```sh
# Yarn
yarn dev           # Next.js app
yarn dev:socket    # Socket.IO server

# npm
npm run dev
npm run dev:socket
```

## Run with Docker

Copy `.env.example` to `.env`, update credentials, then run:

```sh
docker compose up --build
```

MySQL schema is initialized from `database/schema.sql`.

## Checks

```sh
# Yarn
yarn lint
yarn typecheck
yarn test
yarn build

# npm
npm run lint
npm run typecheck
npm run test
npm run build
```

## Structure

```sh
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
├── package-lock.json         # npm dependency lockfile
├── README.md                 # Project documentation
├── tsconfig.json             # TypeScript configuration
├── vitest.config.mts         # Vitest configuration
└── yarn.lock                 # Yarn dependency lockfile
```