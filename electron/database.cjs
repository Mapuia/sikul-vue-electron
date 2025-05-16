const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Database file path
const dbFilePath = path.join(__dirname, 'sikuldb.db');
const schemaFilePath = path.join(__dirname, 'schema.sql');

// Database instance
let db = null;

function initializeDatabase() {
  
  try {
    // Check if database file exists
    const isNewDatabase = !fs.existsSync(dbFilePath);
    
    // Connect to the database
    db = new Database(dbFilePath);
    console.log(isNewDatabase ? 'Database created successfully.' : 'Database connected successfully.');

    // Enable WAL mode for better performance
    db.pragma('journal_mode = WAL');
    
    // Enable foreign key constraints
    db.pragma('foreign_keys = ON');

    // If new database, execute schema
    if (isNewDatabase && fs.existsSync(schemaFilePath)) {
      const schemaSQL = fs.readFileSync(schemaFilePath, 'utf-8');
      db.exec(schemaSQL);
      console.log('Schema executed successfully.');

    }

    // Verify connection
    db.prepare('SELECT 1').get();
    
    return db;
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

function closeDatabase() {
  if (db) {
    try {
      db.close();
      console.log('Database connection closed.');
    } catch (error) {
      console.error('Error closing database:', error);
    } finally {
      db = null;
    }
  }
}

// Initialize database immediately when this module is loaded
initializeDatabase();

// Cleanup on process exit
process.on('exit', closeDatabase);
process.on('SIGINT', () => process.exit());
process.on('SIGTERM', () => process.exit());

module.exports = {
  getDatabase,
  closeDatabase,
  db // Export for direct access if needed
};