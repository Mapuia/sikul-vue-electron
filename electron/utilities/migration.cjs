// utilities/migration.cjs

const { db } = require('../database.cjs');

function ensureMigrationsTable(db) {
  if (!db) throw new Error("DB connection not provided to migration");
  db.prepare(`
    CREATE TABLE IF NOT EXISTS Migrations (
      name TEXT PRIMARY KEY,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
}

function columnExists(db, table, column) {
  const stmt = db.prepare(`PRAGMA table_info(${table});`);
  return stmt.all().some(col => col.name === column);
}

function hasMigrationRun(db, name) {
  const row = db.prepare(`SELECT 1 FROM Migrations WHERE name = ?`).get(name);
  return !!row;
}

function markMigrationRun(db, name) {
  db.prepare(`INSERT INTO Migrations (name) VALUES (?)`).run(name);
}

function runMigration(db) {
  if (!db) throw new Error("DB connection is undefined in runMigration");

  ensureMigrationsTable(db);

  const migrationName = 'add_registrationnumber_to_students';
  const table = 'Students';
  const column = 'RegistrationNumber';

  if (hasMigrationRun(db, migrationName)) {
    console.log(`Migration "${migrationName}" already applied. Skipping.`);
    return;
  }

  if (!columnExists(db, table, column)) {
    console.log(`Column "${column}" not found in "${table}", creating...`);
    db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} TEXT;`).run();
    console.log(`Column "${column}" created successfully.`);
  } else {
    console.log(`Column "${column}" already exists in "${table}".`);
  }

  markMigrationRun(db, migrationName);
  console.log(`Migration "${migrationName}" flagged as complete.`);
}

module.exports = { runMigration };

