const bcrypt = require('bcryptjs');
const keytar = require('keytar');
const { db } = require('../../electron/database.cjs');

const SERVICE_NAME = 'sikul-app';
const SALT_ROUNDS = 10;

// Role definitions
const ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  DEO: 'deo'
 
};

const authService = {
  async initialize() {
    try {
      // Check if users table exists
      const tableExists = db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='Users'"
      ).get();
      
      if (!tableExists) {
        db.prepare(`
          CREATE TABLE Users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `).run();
      }

      // Check if admin user exists, create if not
      const adminExists = db.prepare(
        'SELECT 1 FROM Users WHERE username = ?'
      ).get('admin');
      
      if (!adminExists) {
        const transaction = db.transaction(() => {
          // Create admin
          const adminHash = bcrypt.hashSync('admin123', SALT_ROUNDS);
          db.prepare(
            'INSERT INTO Users (username, password_hash, role) VALUES (?, ?, ?)'
          ).run('admin', adminHash, ROLES.ADMIN);

          // Create Teacher
          const teacherHash = bcrypt.hashSync('teacher123', SALT_ROUNDS);
          db.prepare(
            'INSERT INTO Users (username, password_hash, role) VALUES (?, ?, ?)'
          ).run('teacher1', teacherHash, ROLES.TEACHER);

          // Create DEO      
          const deoHash = bcrypt.hashSync('deo123', SALT_ROUNDS);
          db.prepare(
            'INSERT INTO Users (username, password_hash, role) VALUES (?, ?, ?)'
          ).run('deo1', deoHash, ROLES.DEO);
        });
        
        transaction();
      }
    } catch (error) {
      console.error('Initialization error:', error);
      throw error;
    }
  },

  async login(username, password) {
    try {
      const user = db.prepare(
        'SELECT * FROM Users WHERE username = ?'
      ).get(username);
      
      if (!user) throw new Error('User not found');
      
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) throw new Error('Invalid password');
      
      // Store credentials in keytar
      await keytar.setPassword(SERVICE_NAME, username, password);
      
      return {
        id: user.id,
        username: user.username,
        role: user.role
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  async register(username, password, role) {
    try {
      // Validate role
      
      const existing = db.prepare(
        'SELECT 1 FROM Users WHERE username = ?'
      ).get(username);
      
      if (existing) throw new Error('Username already exists');
      
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      
      const { lastInsertRowid } = db.prepare(
        'INSERT INTO Users (username, password_hash, role) VALUES (?, ?, ?)'
      ).run(username, passwordHash, role);
      
      return lastInsertRowid;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  async changePassword(username, oldPassword, newPassword) {
    try {
      if (newPassword.length < 8) {
        throw new Error('Password must be at least 8 characters');
      }
 
      const user = db.prepare(
        'SELECT * FROM Users WHERE username = ?'
      ).get(username);
      
      if (!user) throw new Error('User not found');
      
      const valid = await bcrypt.compare(oldPassword, user.password_hash);
      if (!valid) throw new Error('Invalid old password');
      
      const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
      const Last_Modified_at = Date();

      const transaction = db.transaction(() => {
        const changes = db.prepare(`UPDATE Users SET password_hash = ?, Last_Modified_at = ? WHERE id = ?`)
          .run(newPasswordHash, Last_Modified_at, user.id);
        keytar.setPassword(SERVICE_NAME, username, newPassword);
        
      });
      transaction();
            // Update credentials in keytar
     
      return true;
    } catch (error) {
      console.error('Password change error:', error);
      throw error;
    }
  },

  async logout(username) {
    try {
      if (username) {
        await keytar.deletePassword(SERVICE_NAME, username);
      } else {
        // Delete all credentials for the service
        const credentials = await keytar.findCredentials(SERVICE_NAME);
        for (const cred of credentials) {
          await keytar.deletePassword(SERVICE_NAME, cred.account);
        }
      }
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  },

  async checkAuth(username) {
    try {
      if (username) {
        // Check specific user's credentials
        const password = await keytar.getPassword(SERVICE_NAME, username);
        return !!password;
      } else {
        // Check if any credentials exist
        const credentials = await keytar.findCredentials(SERVICE_NAME);
        return credentials.length > 0;
      }
    } catch (error) {
      console.error('Auth check error:', error);
      return false;
    }
  },

  async getCurrentUser() {
    try {
      const credentials = await keytar.findCredentials(SERVICE_NAME);
      if (credentials.length > 0) {
        const username = credentials[0].account;
        return db.prepare(
          'SELECT id, username, role FROM Users WHERE username = ?'
        ).get(username);
      }
      return null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },

  async hasRole(username, requiredRoles) {
    try {
      if (!Array.isArray(requiredRoles)) {
        requiredRoles = [requiredRoles];
      }
      
      const user = await this.getCurrentUser();
      if (!user) return false;
      
      return requiredRoles.includes(user.role);
    } catch (error) {
      console.error('Role check error:', error);
      return false;
    }
  },

  isAdmin: async function(username) {
    return this.hasRole(username, ROLES.ADMIN);
  },

  isTeacher: async function(username) {
    return this.hasRole(username, ROLES.TEACHER);
  },

  isDeo: async function(username) {
    return this.hasRole(username, ROLES.DEO);
  }
};

module.exports = {
  ...authService,
  ROLES // Export roles for use in other files
};