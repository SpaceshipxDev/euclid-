# SQLite Architecture

This project stores spreadsheet data for preview pages in a local SQLite database.

## Database

- **sheets** – one row per spreadsheet/task
  - `id` – unique id
  - `customerName`, `orderId`, `contactPerson`, `notes` – metadata
- **cells** – individual cell values
  - `sheetId` – reference to `sheets.id`
  - `mode` – `base`, `quotation`, or `production`
  - `cellId` – e.g. `A1`, `B2`
  - `type` – `text` or `image`
  - `content` – text value or path to an image under `/public/images`

Tables are created and seeded in `lib/db.ts`. The default sheet uses the data previously hard‑coded on the preview page.

## API Routes

- `POST /api/upload` – saves an uploaded image into `public/images` and returns its path.
- `POST /api/cell` – upserts a cell into the database.
- `GET /api/sheet/[id]` – retrieves metadata and cells for a sheet.
- `PATCH /api/sheet/[id]` – updates sheet metadata.

## Frontend Flow

`app/preview/page.tsx` loads spreadsheet data from `/api/sheet/default` on mount. Each cell uses an `EditableCell` component:

1. When text changes, the new value is sent to `/api/cell`.
2. When an image is pasted, it is uploaded through `/api/upload`; the returned path is stored via `/api/cell`.

Cells containing image paths render `<img>` tags so previews appear inside the spreadsheet. All data—including metadata and image references—is persisted in SQLite, providing a scalable store for future tasks.
