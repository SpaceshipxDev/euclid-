import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { defaultBaseData, defaultQuotationData, defaultProductionData, defaultMeta } from './defaultData';
import { Cell } from './types';

const dbFile = path.join(process.cwd(), 'sqlite.db');
const db = new Database(dbFile);
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS sheets (
  id TEXT PRIMARY KEY,
  customerName TEXT,
  orderId TEXT,
  contactPerson TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS cells (
  sheetId TEXT,
  mode TEXT,
  cellId TEXT,
  type TEXT,
  content TEXT,
  PRIMARY KEY (sheetId, mode, cellId),
  FOREIGN KEY (sheetId) REFERENCES sheets(id) ON DELETE CASCADE
);
`);

export function seedDefaultSheet() {
  const exists = db.prepare('SELECT 1 FROM sheets WHERE id = ?').get('default');
  if (exists) return;

  db.prepare('INSERT INTO sheets (id, customerName, orderId, contactPerson, notes) VALUES (@id, @customerName, @orderId, @contactPerson, @notes)').run({
    id: 'default',
    customerName: defaultMeta.customerName,
    orderId: defaultMeta.orderId,
    contactPerson: defaultMeta.contactPerson,
    notes: defaultMeta.notes,
  });

  const insertCell = db.prepare('INSERT INTO cells (sheetId, mode, cellId, type, content) VALUES (@sheetId, @mode, @cellId, @type, @content)');

  function seedCells(data: Cell[][], mode: string) {
    for (const row of data) {
      for (const cell of row) {
        insertCell.run({ sheetId: 'default', mode, cellId: cell.id, type: cell.type, content: cell.content });
      }
    }
  }

  seedCells(defaultBaseData, 'base');
  seedCells(defaultQuotationData, 'quotation');
  seedCells(defaultProductionData, 'production');
}

seedDefaultSheet();

export function getSheet(id: string) {
  const sheet = db.prepare('SELECT * FROM sheets WHERE id = ?').get(id);
  if (!sheet) return null;
  const cells = db.prepare('SELECT mode, cellId as id, type, content FROM cells WHERE sheetId = ?').all(id);
  return { sheet, cells };
}

export function upsertCell(sheetId: string, mode: string, cell: Cell) {
  db.prepare(`INSERT INTO cells (sheetId, mode, cellId, type, content)
    VALUES (@sheetId, @mode, @cellId, @type, @content)
    ON CONFLICT(sheetId, mode, cellId) DO UPDATE SET type=excluded.type, content=excluded.content`)
    .run({ sheetId, mode, cellId: cell.id, type: cell.type, content: cell.content });
}

export function updateMeta(sheetId: string, fields: Record<string, string>) {
  const set = Object.keys(fields).map(k => `${k} = @${k}`).join(', ');
  db.prepare(`UPDATE sheets SET ${set} WHERE id = @sheetId`).run({ ...fields, sheetId });
}

export default db;
