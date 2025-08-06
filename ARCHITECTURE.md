# Architecture

## SQLite Setup
- `lib/db.ts` initializes a SQLite database (`data.db`) using `better-sqlite3`.
- Tables:
  - **tasks** – stores meta information (`customerName`, `orderId`, `contactPerson`, `notes`).
  - **cells** – stores individual cell values with `task_id`, `row`, `col`, `type` (`text` or `image`), and `content`.

## API Routes
- `app/api/tasks/[id]/route.ts` provides a Node.js runtime API.
  - `GET` returns task meta data and cell matrices.
  - `POST` updates cells or meta data. Image data is decoded, saved to `/images`, and the stored path is written back to the database.

## Frontend
- `app/preview/[id]/page.tsx` loads task data from the API and renders the grid.
- Cell edits invoke the API to persist changes. When an image is pasted, it is uploaded and the returned `/images/...` path is displayed in the cell.

## Images
- All pasted images are stored in `images/`. The database keeps only the relative path (e.g., `/images/<file>`), ensuring consistent rendering across the app.
