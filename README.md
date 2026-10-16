# Stockroom

Demo: https://inventory-dashboard-case.vercel.app

Note: Socket.IO is fully testable locally (Vercel doesn't support it).

## Getting Started

Requirements:
- Node.js 24
- Yarn

### Run

```sh
yarn install --frozen-lockfile

yarn dev:all
```

Open [http://localhost:3000](http://localhost:3000).

### Run services separately

```sh
yarn dev           # App — port 3000
yarn dev:socket    # Socket.IO — port 3001
```

## Docker

```sh
docker compose up --build
```

## Checks

```sh
yarn lint
yarn typecheck
yarn test
yarn build
```

## Structure

```sh
inventory-dashboard/
├── database/
│   └── schema.sql            # MySQL schema for review
├── Dockerfile                # Multi-stage Docker image for the app
├── docker-compose.yml        # App and Socket.IO, with an optional MySQL demo profile
├── public/
│   ├── icon.svg              # App icon
│   ├── manifest.webmanifest  # PWA manifest
│   ├── offline.html          # Offline fallback page
│   └── sw.js                 # Service worker
├── server/
│   └── socket.ts             # Socket.IO server for the active-tab counter
├── src/
│   ├── app/                  # Routes and API handlers
│   ├── components/           # React components
│   ├── lib/                  # Data, Redux store, and helpers
│   └── styles/               # SCSS styles
├── .env.example              # Example environment variables
├── .dockerignore             # Docker build exclusions
├── .gitignore                # Git ignore rules
├── eslint.config.mjs         # ESLint configuration
├── next.config.ts            # Next.js configuration
├── package.json              # Dependencies and scripts
├── README.md                 # Project documentation
├── tsconfig.json             # TypeScript configuration
├── vitest.config.mts         # Vitest configuration
└── yarn.lock                 # Yarn dependency lockfile
```
