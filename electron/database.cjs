const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

const dbName = 'sikuldb.db';
const schemaFileName = 'schema.sql';

// Determine DB and schema paths
const devDbPath = path.join(__dirname, dbName);
const userDataDir = app.getPath('userData');
const prodDbPath = path.join(userDataDir, dbName);
const isDev = !app.isPackaged;

// Correct schema path for dev and production
const schemaFilePath = isDev
  ? path.join(__dirname, schemaFileName)
  : path.join(process.resourcesPath, schemaFileName); // Handles asar-packed builds

let db = null;

function initializeDatabase() {
  try {
    const dbPath = isDev ? devDbPath : prodDbPath;
    const isNewDatabase = !fs.existsSync(dbPath);

    // Create or open the database
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    if (isNewDatabase) {
      if (!fs.existsSync(schemaFilePath)) {
        throw new Error(`Schema file not found at: ${schemaFilePath}`);
      }

      const schemaSQL = fs.readFileSync(schemaFilePath, 'utf-8');
      db.exec(schemaSQL);
      console.log(`New ${isDev ? 'development' : 'production'} database created and schema applied at: ${dbPath}`);
    } else {
      console.log(`Existing database loaded from: ${dbPath}`);
    }

    // Simple query to validate DB connection
    db.prepare('SELECT 1').get();
    return db;
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

function getDatabase() {
  if (!db) throw new Error('Database not initialized. Call initializeDatabase() first.');
  return db;
}

function closeDatabase() {
  if (db) {
    try {
      db.close();
      console.log('Database connection closed.');
    } catch (err) {
      console.error('Error closing the database:', err);
    } finally {
      db = null;
    }
  }
}

// Initialize database on load
initializeDatabase();

// Handle process exit to close DB
process.on('exit', closeDatabase);
process.on('SIGINT', () => process.exit());
process.on('SIGTERM', () => process.exit());

module.exports = {
  getDatabase,
  closeDatabase,
  db,
};
