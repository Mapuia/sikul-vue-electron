const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

const dbName = 'sikuldb.db';
const schemaFileName = 'schema.sql';

const devDbPath = path.join(__dirname, dbName);
const schemaFilePath = path.join(__dirname, schemaFileName);
const userDataDir = app.getPath('userData');
const prodDbPath = path.join(userDataDir, dbName);

const isDev = !app.isPackaged;
let db = null;

function initializeDatabase() {
  try {
    const dbPath = isDev ? devDbPath : prodDbPath;
    const isNewDatabase = !fs.existsSync(dbPath);

    if (isNewDatabase) {
      // Load schema
      if (!fs.existsSync(schemaFilePath)) {
        throw new Error('Schema file not found.');
      }
      const schemaSQL = fs.readFileSync(schemaFilePath, 'utf-8');

      // Create new database and apply schema
      db = new Database(dbPath);
      db.pragma('journal_mode = WAL');
      db.pragma('foreign_keys = ON');
      db.pragma('timezone = +05:30');
      db.exec(schemaSQL);
      console.log(`New ${isDev ? 'development' : 'production'} DB created and schema applied at: ${dbPath}`);
    } else {
      // Open existing database
      db = new Database(dbPath);
      db.pragma('journal_mode = WAL');
      db.pragma('foreign_keys = ON');
      console.log(`Existing DB loaded from: ${dbPath}`);
    }

    // Validate DB connection
    db.prepare('SELECT 1').get();
    return db;
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}


function getDatabase() {
  if (!db) throw new Error('Call initializeDatabase() first.');
  return db;
}

function closeDatabase() {
  if (db) {
    try {
      db.close();
      console.log('Database closed.');
    } catch (err) {
      console.error('Error closing DB:', err);
    } finally {
      db = null;
    }
  }
}

initializeDatabase();

process.on('exit', closeDatabase);
process.on('SIGINT', () => process.exit());
process.on('SIGTERM', () => process.exit());

module.exports = {
  getDatabase,
  closeDatabase,
  db,
};
