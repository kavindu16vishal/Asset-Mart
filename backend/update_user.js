const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.run("UPDATE users SET name = 'Kavindu Vishal' WHERE id = 5", (err) => {
  if (err) throw err;
  console.log('Updated user 5 name to Kavindu Vishal');
  db.close();
});
