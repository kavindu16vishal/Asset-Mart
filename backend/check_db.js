const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('--- USERS ---');
db.all('SELECT id, name, email FROM users', [], (err, rows) => {
  if (err) throw err;
  console.log(JSON.stringify(rows, null, 2));
  
  console.log('\n--- ISSUES ---');
  db.all('SELECT id, reportedBy FROM issues', [], (err, rows) => {
    if (err) throw err;
    console.log(JSON.stringify(rows, null, 2));
    db.close();
  });
});
