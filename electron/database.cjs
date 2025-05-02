const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Database file path
const dbFilePath = path.join(__dirname, 'sikuldb.db');
const schemaFilePath = path.join(__dirname, 'schema.sql');

// Database object
let db;

function initializeDatabase() {
  try {
    let isNewDatabase = !fs.existsSync(dbFilePath); // Check if new database

    // Connect to the database 
    db = Database(dbFilePath);
    console.log(isNewDatabase ? 'Database created successfully.' : 'Database connected....');

    // If it's a new database, execute the schema
    if (isNewDatabase) {
      runSchema();
    }

  } catch (error) {
    console.error('Error initializing database:', error);
    throw error; // Re-throw to prevent the app from running without a DB.
  }

  return db;
};

function runSchema() {
  try {
    if (!fs.existsSync(schemaFilePath)) {
      throw new Error('No Schema File Found');
    }

    const schemaSQL = fs.readFileSync(schemaFilePath, 'utf-8');
    db.exec(schemaSQL);
    console.log('Schema executed successfully.');
  } catch (error) {
    console.error('Error executing schema.sql:', error);
    throw error;
  }
};

// Function to get the database connection
function getDatabase() {
  if (!db) {
    db = initializeDatabase();
  }
  return db;
};

// Function to close the database connection
function closeDatabase() {
  if (db) {
    db.close();
    console.log('Database connection closed.');
    db = null;
  }
};

// Export the functions
module.exports = {
  initializeDatabase,
  getDatabase,
  closeDatabase,
  
};


