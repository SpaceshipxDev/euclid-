import Database from 'better-sqlite3';
import path from 'path';

const dbFile = path.join(process.cwd(), 'data.db');
const db = new Database(dbFile);

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY,
    meta TEXT
  );

  CREATE TABLE IF NOT EXISTS cells (
    id INTEGER PRIMARY KEY,
    task_id INTEGER,
    row INTEGER,
    col INTEGER,
    type TEXT,
    content TEXT,
    FOREIGN KEY(task_id) REFERENCES tasks(id)
  );
`);

export default db;
