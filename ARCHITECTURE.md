# Architecture

## SQLite Setup
- `lib/db.ts` initializes a SQLite database (`data.db`) using `better-sqlite3`.
- Tables:
  - **spreadsheets** – stores meta information (`customerName`, `orderId`, `contactPerson`, `notes`).
  - **cells** – stores individual cell values with `row`, `col`, `mode` (`base`, `quotation`, `production`), `type` (`text` or `image`), and `content`.
- On first run the database is seeded with sample data.

## API Routes
- `app/api/spreadsheet/route.ts` provides a Node.js runtime API.
  - `GET` returns spreadsheet meta data and cell matrices for each mode.
  - `POST` updates cells or meta data. Image data is decoded, saved to `/public/images`, and the stored path is written back to the database.

## Frontend
- `app/preview/page.tsx` loads spreadsheet data from the API and renders the grid.
- Cell edits invoke the API to persist changes. When an image is pasted, it is uploaded and the returned `/images/...` path is displayed in the cell.

## Images
- All pasted images are stored in `public/images`. The database keeps only the relative path (e.g., `/images/<file>`), ensuring consistent rendering across the app.
