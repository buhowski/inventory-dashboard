# Stockroom

An inventory dashboard for reviewing incoming orders and their products. Built with Next.js,
TypeScript, Redux Toolkit, Socket.IO, and responsive SCSS/BEM styles.

## Features

- Orders and Products pages with shared search and product-type filtering.
- Expandable order details, product counts, dates, and totals in USD and UAH.
- Order and product deletion with confirmation; demo inventory can be restored.
- Live date, time, and active-tab count through a Socket.IO presence server.
- Fetch-based API routes serving in-memory demo data.
- Browser storage, lazy-loaded pages, route transitions, and a PWA offline fallback.
- Docker Compose setup and a MySQL schema for the database design.

## Run locally

Requirements: Node.js 22+ and Yarn 1.22.22.

```sh
yarn install --frozen-lockfile
yarn dev:all
```

Open [http://localhost:3000](http://localhost:3000). The Socket.IO server listens on port `3001`.
To run the services separately, use `yarn dev` and `yarn dev:socket`.

## Docker

Copy `.env.example` to `.env`, replace the sample passwords, then run:

```sh
docker compose up --build
```

The app and Socket.IO server are available on ports `3000` and `3001`; MySQL is available on
`3306`. The app currently uses in-memory demo data and does not connect to MySQL.

## Checks

```sh
yarn lint
yarn typecheck
yarn test
yarn build
```

## Scope

The UI is styled with custom SCSS/BEM rather than Bootstrap. Forms and validation, authentication,
internationalization, and MySQL persistence are not part of this demo.
