# flowlet

English | [简体中文](./README.zh-CN.md)

**flowlet** is a mobile-first, local-only offline expense-tracking PWA (Progressive Web App) focused on fast daily logging and clear spending insights. All ledger data stays in your browser's local IndexedDB (via Dexie 4)—no accounts, no servers, and no cloud dependencies.

## Tech Stack

- **Framework**: React 19 + TypeScript + Vite 6 + React Router 7
- **Styling & Charts**: Tailwind CSS 4 + ECharts 6
- **Local Storage & PWA**: Dexie 4 (IndexedDB) + `vite-plugin-pwa`
- **Import / Export**: PapaParse (UTF-8 BOM CSV) + JSON backup
- **Testing**: Vitest + `fake-indexeddb` + Playwright

## Core Features

- **Local Offline Storage**: Stores `expenses`, `categories`, `budgets`, and `settings` in IndexedDB using integer cents (`amountCents`) to avoid floating-point precision errors, pre-seeded with 12 default categories.
- **Fast Expense Entry**: Bottom sheet with a custom `+` / `−` expression keypad, automatic `#tag` extraction from notes, quick today/yesterday switching, continuous entry mode, two-step delete confirmation, and budget threshold toasts.
- **Expense List & Filters**: Day-grouped expense timeline with daily subtotals, monthly or all-time browsing, keyword search, category/tag filters, and swipe-to-delete.
- **Multi-Dimensional Analytics**: Monthly, yearly, and custom date-range views featuring ECharts category donut charts (click to drill down), daily/monthly trend bar charts with average lines, period-over-period comparisons, tag rankings, and top-10 single expenses.
- **Budget Tracking**: Overall and per-category monthly budgets with 80% warning and 100% overspend threshold alerts.
- **CSV & JSON Backup**: Export UTF-8 BOM CSV files (Excel-friendly) and full JSON backups; import CSV with duplicate detection preview and support merge or overwrite JSON restore.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Typecheck
npm run typecheck

# Unit tests & E2E tests
npm run test
npm run test:e2e

# Production build & preview
npm run build
npm run preview
```
