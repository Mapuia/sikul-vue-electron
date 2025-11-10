// utils/databaseMigrations.js

const { db } = require('../database.cjs');

async function runMigrations() {
  try {
    // Check if the column already exists
    const RegistrationNumberExists = db.prepare(`PRAGMA table_info(Students)`).all().some(col => col.name === 'RegistrationNumber');
    const noOfWorkingDaysExists = db.prepare(`PRAGMA table_info(ActiveExams)`).all().some(col => col.name === 'noOfWorkingDays');

    if(!noOfWorkingDaysExists){
      db.prepare('BEGIN TRANSACTION').run()
      db.prepare(`
        CREATE TABLE ActiveExams_new (
          Id INTEGER PRIMARY KEY AUTOINCREMENT,
          AcademicYearId INTEGER NOT NULL,
          ExamId INTEGER NOT NULL,
          MajorMaxMark DECIMAL (5, 2) NOT NULL,
          MinorMaxMark DECIMAL (5, 2) NOT NULL,
          PassingPercentage DECIMAL (5, 2) DEFAULT 40.0 CHECK (PassingPercentage BETWEEN 0 AND 100),
          IsActive BOOLEAN DEFAULT 0,
          Result_Published BOOLEAN DEFAULT 0,
          PublishDate DATETIME,
          noOfWorkingDays INTEGER,
          Creation_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          Modified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (ExamId) REFERENCES Exams (Id) ON DELETE CASCADE,
          FOREIGN KEY (AcademicYearId) REFERENCES AcademicYears (Id) ON DELETE CASCADE,
          UNIQUE (AcademicYearId, ExamId)
        )          
        `).run();

        db.prepare(`
          INSERT INTO ActiveExams_new (
            Id, AcademicYearId, ExamId,
            MajorMaxMark, MinorMaxMark, PassingPercentage, IsActive,
            Result_Published, PublishDate, 
            Creation_at,
            Modified_at            
          )
          SELECT
            Id, AcademicYearId, ExamId,
            MajorMaxMark, MinorMaxMark, PassingPercentage, IsActive,
            Result_Published, PublishDate, 
            Creation_at,
            Modified_at
          FROM
            ActiveExams
          `).run();
        db.prepare(`DROP TABLE ActiveExams;`).run();
        db.prepare(`ALTER TABLE ActiveExams_new RENAME TO ActiveExams;`).run();

        db.prepare('COMMIT').run();

        console.log('noOfWorkingDays column added after PublishDate.');  
    }else{}

    if (!RegistrationNumberExists) {
      // Start transaction
      db.prepare('BEGIN TRANSACTION').run();

      db.prepare(`
        CREATE TABLE Students_new (
          Id TEXT PRIMARY KEY,
          Name TEXT NOT NULL,
          Gender TEXT CHECK (Gender IN ('Male', 'Female')),
          FathersName TEXT,
          MothersName TEXT,
          DOB DATE,
          Aadhaar TEXT,
          APAR TEXT,
          PEN TEXT,
          Contact TEXT,
          Email TEXT,
          Address TEXT,
          PIN TEXT,
          FirstAdmissionDate DATE DEFAULT (CURRENT_TIMESTAMP),
          RegistrationNumber TEXT, 
          Status TEXT NOT NULL DEFAULT 'Admitted',
          Caste TEXT,
          Religion TEXT,
          Height INTEGER,
          Weight DECIMAL (5, 2),
          BloodGroup TEXT,
          Creation_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          Last_Modified_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `).run();

      db.prepare(`
        INSERT INTO Students_new (
          Id, Name, Gender, FathersName, MothersName, DOB, Aadhaar, APAR, PEN,
          Contact, Email, Address, PIN, FirstAdmissionDate,
          Status, Caste, Religion, Height, Weight, BloodGroup,
          Creation_at, Last_Modified_at
        )
        SELECT
          Id, Name, Gender, FathersName, MothersName, DOB, Aadhaar, APAR, PEN,
          Contact, Email, Address, PIN, FirstAdmissionDate,
          Status, Caste, Religion, Height, Weight, BloodGroup,
          Creation_at, Last_Modified_at
        FROM Students;
      `).run();

      db.prepare(`DROP TABLE Students;`).run();
      db.prepare(`ALTER TABLE Students_new RENAME TO Students;`).run();

      db.prepare('COMMIT').run();

      console.log('RegistrationNumber column added after FirstAdmissionDate.');
    } else {
    //console.log(`Column RegistrationNumber already exists in "Students".`);
  }

  } catch (error) {
    db.prepare('ROLLBACK').run();
    console.error('Students migration failed:', error);
    throw error;
  }
}
module.exports = { runMigrations };

/*
function ensureGradeColumnIsText() {
  // Step 1: Check column type
  db=getDatabase();
  const columnInfo = db.prepare("PRAGMA table_info(CoScholasticMarks)").all();
  const gradeColumn = columnInfo.find(col => col.name === 'Grade');
  
  console.log("Grade Info:",gradeColumn);

  if (gradeColumn.type.toUpperCase() === 'TEXT') {
    console.log("Grade column is already of type TEXT.");
    return;
  }

  console.log(`Grade column is of type ${gradeColumn.type}. Altering to TEXT...`);

  // Step 2: Begin transaction and alter table
  const alterTransaction = db.transaction(() => {
    // Rename old table
    db.prepare(`ALTER TABLE CoScholasticMarks RENAME TO CoScholasticMarks_old`).run();

    // Recreate with correct column types
    db.prepare(`
      CREATE TABLE IF NOT EXISTS CoScholasticMarks (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    StudentId INTEGER NOT NULL,
    SubjectId INTEGER NOT NULL,
    ActiveExamId INTEGER NOT NULL,
    AcademicYearId INTEGER NOT NULL,
    Grade TEXT,
    Creation_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    Last_Modified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (StudentId) REFERENCES Students(Id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (SubjectId) REFERENCES Subjects(Id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (ActiveExamId) REFERENCES ActiveExams(Id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (AcademicYearId) REFERENCES AcademicYears(Id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE(StudentId, SubjectId, ActiveExamId)
)
    `).run();

    // Copy data
    db.prepare(`
      INSERT INTO CoScholasticMarks (
        StudentId, SubjectId, ActiveExamId, AcademicYearId, Grade, Last_Modified_at
      )
      SELECT StudentId, SubjectId, ActiveExamId, AcademicYearId, Grade, Last_Modified_at
      FROM CoScholasticMarks_old
    `).run();

    // Drop old table
    db.prepare(`DROP TABLE CoScholasticMarks_old`).run();
  });

  // Run the transaction
  try {
    alterTransaction();
    console.log("Column 'Grade' successfully changed to TEXT.");
  } catch (error) {
    console.error("Failed to alter 'Grade' column to TEXT:", error);
  }
}

*/

/**const { db } = require('../database.cjs');

async function runMigrations() {
   
  try {
    // Check if the UNIQUE constraint already exists
    const checkConstraint = db.prepare(`
      SELECT 1 FROM sqlite_master 
      WHERE type = 'table' 
      AND name = 'CumulativeMarks' 
      AND sql LIKE '%UNIQUE(StudentId, SubjectId, CummulativeType)%'
    `).get();

    if (!checkConstraint) {
      console.log('Adding UNIQUE constraint to Marks table...');
      
      // Use a transaction for safety
      db.prepare('BEGIN TRANSACTION').run();

      db.prepare(`ALTER TABLE CumulativeMarks RENAME TO CumulativeMarks_old`).run();
      
      // Create temp table with the new schema
      db.prepare(`CREATE TABLE CumulativeMarks (
          Id INTEGER PRIMARY KEY AUTOINCREMENT,
          StudentId INTEGER NOT NULL,
          SubjectId INTEGER NOT NULL,
          CummulativeTypeId INTEGER NOT NULL,
          TotalMarks REAL DEFAULT 0,
          TotalMarksObtained REAL DEFAULT 0,
          AcademicYearId INTEGER NOT NULL,
          Creation_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          Modified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (StudentId) REFERENCES Students(Id),
          FOREIGN KEY (SubjectId) REFERENCES Subjects(Id),
          FOREIGN KEY (AcademicYearId) REFERENCES AcademicYears(Id),
          UNIQUE(StudentId, SubjectId, CummulativeTypeId)
        )
      `).run();
      
     
      // Drop old table
      db.prepare('DROP TABLE CumulativeMarks_old').run();
      
       
      db.prepare('COMMIT').run();
      console.log('CumulativeMarks mofification completed successfully');
    }
  } catch (error) {
    db.prepare('ROLLBACK').run();
    console.error('Database migration failed:', error);
    throw error; // Rethrow to handle in main process
  }
}



/****
 *   
  try {
    // Check if the UNIQUE constraint already exists
    
      console.log('Adding UNIQUE constraint to CoScholasticMarks table...');
      
      // Use a transaction for safety
      db.prepare('BEGIN TRANSACTION').run();
      
      // Create temp table with the new schema
      db.prepare(`
        CREATE TABLE IF NOT EXISTS CoScholasticMarks_temp (
          Id INTEGER PRIMARY KEY AUTOINCREMENT,
          StudentId INTEGER NOT NULL,
          SubjectId INTEGER NOT NULL,
          ActiveExamId INTEGER NOT NULL,
          AcademicYearId INTEGER NOT NULL,
          Score TEXT,
          Creation_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          Modified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (StudentId) REFERENCES Students(Id),
          FOREIGN KEY (SubjectId) REFERENCES Subjects(Id),
          FOREIGN KEY (ActiveExamId) REFERENCES ActiveExam(Id),
          FOREIGN KEY (AcademicYearId) REFERENCES AcademicYears(Id),
          UNIQUE(StudentId, SubjectId, ActiveExamId)
        )
      `).run();
      
      // Copy data
      db.prepare(`
        INSERT INTO CoScholasticMarks_temp 
        SELECT * FROM CoScholasticMarks
      `).run();
      
      // Drop old table
      db.prepare('DROP TABLE CoScholasticMarks').run();
      
      // Rename temp table
      db.prepare('ALTER TABLE CoScholasticMarks_temp RENAME TO CoScholasticMarks').run();
      
      db.prepare('COMMIT').run();
      console.log('CoScholasticMarks table migration completed successfully');
   
  } catch (error) {
    db.prepare('ROLLBACK').run();
    console.error('Database migration failed:', error);
    throw error; // Rethrow to handle in main process
  }


   try {
    // Check if the UNIQUE constraint already exists
    const checkConstraint = db.prepare(`
      SELECT 1 FROM sqlite_master 
      WHERE type = 'table' 
      AND name = 'Marks' 
      AND sql LIKE '%UNIQUE(StudentId, SubjectId, ActiveExamId)%'
    `).get();

    if (!checkConstraint) {
      console.log('Adding UNIQUE constraint to Marks table...');
      
      // Use a transaction for safety
      db.prepare('BEGIN TRANSACTION').run();
      
      // Create temp table with the new schema
      db.prepare(`
        CREATE TABLE IF NOT EXISTS Marks_temp (
          Id INTEGER PRIMARY KEY AUTOINCREMENT,
          StudentId INTEGER NOT NULL,
          SubjectId INTEGER NOT NULL,
          ActiveExamId INTEGER NOT NULL,
          AcademicYearId INTEGER NOT NULL,
          MarksObtained REAL,
          Creation_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          Modified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (StudentId) REFERENCES Students(Id),
          FOREIGN KEY (SubjectId) REFERENCES Subjects(Id),
          FOREIGN KEY (ActiveExamId) REFERENCES ActiveExam(Id),
          FOREIGN KEY (AcademicYearId) REFERENCES AcademicYears(Id),
          UNIQUE(StudentId, SubjectId, ActiveExamId)
        )
      `).run();
      
      // Copy data
      db.prepare(`
        INSERT INTO Marks_temp 
        SELECT * FROM Marks
      `).run();
      
      // Drop old table
      db.prepare('DROP TABLE Marks').run();
      
      // Rename temp table
      db.prepare('ALTER TABLE Marks_temp RENAME TO Marks').run();
      
      db.prepare('COMMIT').run();
      console.log('Marks table migration completed successfully');
    }
  } catch (error) {
    db.prepare('ROLLBACK').run();
    console.error('Database migration failed:', error);
    throw error; // Rethrow to handle in main process
  }
}
 */