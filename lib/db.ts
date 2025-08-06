import Database from 'better-sqlite3';
import path from 'path';

const dbFile = path.join(process.cwd(), 'data.db');
const db = new Database(dbFile);

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    customerName TEXT,
    orderId TEXT,
    contactPerson TEXT,
    notes TEXT
  );

  CREATE TABLE IF NOT EXISTS cells (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id TEXT,
    row INTEGER,
    col INTEGER,
    type TEXT,
    content TEXT,
    FOREIGN KEY(task_id) REFERENCES tasks(id)
  );
`);

export default db;
