import Database from 'better-sqlite3';
import path from 'path';

const dbFile = path.join(process.cwd(), 'data.db');
const db = new Database(dbFile);

db.exec(`
  CREATE TABLE IF NOT EXISTS spreadsheets (
    id INTEGER PRIMARY KEY,
    customerName TEXT,
    orderId TEXT,
    contactPerson TEXT,
    notes TEXT
  );

  CREATE TABLE IF NOT EXISTS cells (
    id INTEGER PRIMARY KEY,
    spreadsheet_id INTEGER,
    row INTEGER,
    col INTEGER,
    mode TEXT,
    type TEXT,
    content TEXT,
    FOREIGN KEY(spreadsheet_id) REFERENCES spreadsheets(id)
  );
`);

const countRow = db.prepare('SELECT COUNT(*) as count FROM spreadsheets').get();
if (countRow.count === 0) {
  const info = db.prepare(`INSERT INTO spreadsheets (customerName, orderId, contactPerson, notes)
    VALUES (?, ?, ?, ?)`)
    .run('Apple Inc.', `QUO-${new Date().getFullYear()}-0815`, 'Tim Cook', 'Urgent project for visionOS.');
  const spreadsheetId = info.lastInsertRowid as number;

  const baseSeed = [
    ['', 'M3 Pro 笔记本电脑', '铝合金', '100', '深空黑', '加急订单'],
    ['', '无线充电底座', 'PC+ABS', '500', '类肤质喷涂', '需定制Logo'],
    ['', '精密仪器外壳', '不锈钢 304', '250', '镜面抛光', ''],
  ];

  const quotationSeed = [
    [`${(Math.random() * 500 + 100).toFixed(2)}`, ''],
    [`${(Math.random() * 500 + 100).toFixed(2)}`, ''],
    [`${(Math.random() * 500 + 100).toFixed(2)}`, ''],
  ];

  const productionSeed = [
    ['CNC 5轴', '公差 +/- 0.02mm'],
    ['CNC 5轴', '公差 +/- 0.02mm'],
    ['CNC 5轴', '公差 +/- 0.02mm'],
  ];

  const insert = db.prepare('INSERT INTO cells (spreadsheet_id,row,col,mode,type,content) VALUES (?,?,?,?,?,?)');
  for (let r = 0; r < baseSeed.length; r++) {
    for (let c = 0; c < baseSeed[r].length; c++) {
      insert.run(spreadsheetId, r, c, 'base', 'text', baseSeed[r][c]);
    }
    for (let c = 0; c < quotationSeed[r].length; c++) {
      insert.run(spreadsheetId, r, c, 'quotation', 'text', quotationSeed[r][c]);
    }
    for (let c = 0; c < productionSeed[r].length; c++) {
      insert.run(spreadsheetId, r, c, 'production', 'text', productionSeed[r][c]);
    }
  }
}

export default db;
