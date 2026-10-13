# Stockroom

A responsive inventory dashboard for reviewing incoming orders and their products. Built with Next.js, TypeScript, Redux Toolkit, Tailwind CSS, and Socket.IO.

## Features

- Orders and products pages with shared search and product-category filtering.
- Expandable order details, currency totals, and confirmed order deletion.
- Live date, time, and Socket.IO active-tab count.
- Browser storage for deleted demo orders, lazy-loaded pages, and a PWA offline fallback.
- BEM-named SCSS modules style the shared shell, orders, and catalog views; Tailwind CSS v4 provides the base layer and theme tokens.
- MySQL schema and Docker Compose configuration for local infrastructure.

> The REST API currently serves sample data in memory. MySQL is not connected to the application, so order deletions are stored only in the current browser. Docker Compose is included but has not been verified in this environment.

## Styles

All global styles live directly in `src/styles` without nested folders. `globals.css` is the Tailwind CSS v4 entry point; `main.scss` imports the partials for design tokens, base styles, the application shell, shared components, page-specific styles, and responsive rules. Component styles use BEM naming with Sass nesting and the parent selector. The CSS and SCSS entry points remain separate and are imported from the root layout so Tailwind's Turbopack processing remains intact.

Workspace formatting uses Prettier with tabs, a two-column tab width, 100-character print width, single quotes, and unwrapped Markdown prose. VS Code formats files with Prettier on save.

## Requirements

- Node.js 22 or later and Yarn 1.22.22 (Corepack is recommended).
- Docker Compose v2 (optional, for the containerized setup).

## Local development

```bash
yarn install --frozen-lockfile
yarn dev:all
```

Open [http://localhost:3000](http://localhost:3000). The Next.js app runs on port `3000`; the Socket.IO presence server runs on port `3001`.

To run services separately, use `yarn dev` and `yarn dev:socket` in separate terminals.

## Docker

Copy `.env.example` to `.env` and replace the sample passwords with unique local values. Then run:

```bash
docker compose up --build
```

The app is available on port `3000`, Socket.IO on `3001`, and MySQL on `3306`. The schema in `database/schema.sql` is loaded when the database volume is first initialized.

## Checks

```bash
yarn typecheck
yarn lint
yarn test
yarn build
```
