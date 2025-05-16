-- Users Table
CREATE TABLE IF NOT EXISTS Users (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    Username TEXT NOT NULL UNIQUE,
    Password TEXT NOT NULL,
    Role TEXT,
    Creation_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    Last_Modified_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- AcademicYears Table
CREATE TABLE IF NOT EXISTS AcademicYears (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    YearName TEXT NOT NULL UNIQUE,
    StartDate DATE NOT NULL,
    EndDate DATE NOT NULL,
    IsActive INTEGER DEFAULT 0 CHECK(IsActive IN (0, 1)),
    Creation_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CHECK (EndDate > StartDate)
);

-- Classes Table
CREATE TABLE IF NOT EXISTS Classes (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    ClassName TEXT NOT NULL UNIQUE,
    Creation_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Sections Table
CREATE TABLE IF NOT EXISTS Sections (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    SectionName TEXT NOT NULL UNIQUE,
    Creation_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Class and Section Mapping
CREATE TABLE IF NOT EXISTS ClassSectionMapping (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    ClassId INTEGER,
    SectionId INTEGER,
    Creation_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ClassId) REFERENCES Classes(Id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (SectionId) REFERENCES Sections(Id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE(ClassId, SectionId)
);

-- Subjects Table
CREATE TABLE IF NOT EXISTS Subjects (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    SubjectName TEXT NOT NULL UNIQUE,
    SubjectCategory TEXT,
    Creation_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ClassSubjectMapping Table
CREATE TABLE IF NOT EXISTS ClassSubjectMapping (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    ClassId INTEGER NOT NULL,
    SubjectId INTEGER NOT NULL,
    Creation_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ClassId) REFERENCES Classes(Id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (SubjectId) REFERENCES Subjects(Id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE (ClassId, SubjectId)
);

-- Exams Table
CREATE TABLE IF NOT EXISTS Exams (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    ExamName TEXT NOT NULL UNIQUE,
    Creation_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    Modified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    Description TEXT    
);

-- ActiveExam Table
CREATE TABLE IF NOT EXISTS ActiveExams (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,   
    AcademicYearId INTEGER NOT NULL,
    ExamId INTEGER NOT NULL,
    MajorMaxMark REAL NOT NULL,
    MinorMaxMark REAL NOT NULL,
    IsActive INTEGER DEFAULT 0 CHECK(IsActive IN (0, 1)),
    Result_Published INTEGER DEFAULT 0 CHECK(Result_Published IN (0, 1)),
    PublishDate DATETIME,
    Creation_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    Modified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ExamId) REFERENCES Exams(Id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (AcademicYearId) REFERENCES AcademicYears(Id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE(AcademicYearId, ExamId)
);

-- Students Table
CREATE TABLE IF NOT EXISTS Students (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    Name TEXT NOT NULL,
    Gender TEXT CHECK(Gender IN ('Male', 'Female')),
    FathersName TEXT,
    MothersName TEXT,
    DOB DATE,
    Aadhaar TEXT UNIQUE,
    APAR TEXT UNIQUE,
    PEN TEXT UNIQUE,
    Contact TEXT CHECK(length(Contact) = 10 AND Contact GLOB '[0-9]*'),
    Address TEXT,
    FirstAdmissionDate DATE DEFAULT CURRENT_TIMESTAMP,
    Status TEXT NOT NULL DEFAULT 'Admitted', --"Passed Out"
    Caste TEXT,
    Religion TEXT,
    Height INTEGER CHECK(Height > 0 AND Height < 250),
    Weight REAL CHECK(Weight > 0 AND Weight < 200),
    BloodGroup TEXT CHECK(BloodGroup IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    Creation_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    Last_Modified_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Admission Table
CREATE TABLE IF NOT EXISTS Admissions (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    StudentId INTEGER NOT NULL,
    AcademicYearId INTEGER NOT NULL,
    ClassId INTEGER NOT NULL,
    SectionId INTEGER NOT NULL,
    RollNo INTEGER,
    AdmissionType TEXT NOT NULL CHECK(AdmissionType IN ('New', 'Re-admission')),
    Creation_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    Last_Modified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (StudentId) REFERENCES Students(Id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (ClassId) REFERENCES Classes(Id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (SectionId) REFERENCES Sections(Id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (AcademicYearId) REFERENCES AcademicYears(Id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE (AcademicYearId, ClassId, SectionId, RollNo)
);
-- Marks Table (Fixed)
CREATE TABLE IF NOT EXISTS Marks (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    StudentId INTEGER NOT NULL,
    SubjectId INTEGER NOT NULL,
    ActiveExamId INTEGER NOT NULL,
    AcademicYearId INTEGER NOT NULL,
    MarksObtained REAL NOT NULL,
    Creation_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    Last_Modified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (StudentId) REFERENCES Students(Id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (SubjectId) REFERENCES Subjects(Id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (ActiveExamId) REFERENCES ActiveExams(Id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (AcademicYearId) REFERENCES AcademicYears(Id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE(StudentId, SubjectId, ActiveExamId)
);
-- CoScholasticMarks Table (Fixed)
CREATE TABLE IF NOT EXISTS CoScholasticMarks (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    StudentId INTEGER NOT NULL,
    SubjectId INTEGER NOT NULL,
    ActiveExamId INTEGER NOT NULL,
    AcademicYearId INTEGER NOT NULL,
    Score REAL NOT NULL,
    Creation_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    Last_Modified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (StudentId) REFERENCES Students(Id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (SubjectId) REFERENCES Subjects(Id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (ActiveExamId) REFERENCES ActiveExams(Id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (AcademicYearId) REFERENCES AcademicYears(Id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE(StudentId, SubjectId, ActiveExamId)
);

-- CumulativeMarks Table (Fixed)
CREATE TABLE IF NOT EXISTS CumulativeMarks (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    StudentId INTEGER NOT NULL,
    ActiveExamId INTEGER NOT NULL,
    TotalMarksObtained REAL DEFAULT 0,
    AcademicYearId INTEGER NOT NULL,
    Creation_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    Last_Modified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (StudentId) REFERENCES Students(Id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (ActiveExamId) REFERENCES ActiveExams(Id) ON DELETE CASCADE ON UPDATE CASCADE,    
    FOREIGN KEY (AcademicYearId) REFERENCES AcademicYears(Id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE(StudentId, ActiveExamId)
);

-- Results Table (Fixed)
CREATE TABLE IF NOT EXISTS Results (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    AcademicYearId INTEGER NOT NULL,
    StudentId INTEGER NOT NULL,
    ActiveExamId INTEGER NOT NULL, 
    TotalMarksObtained REAL NOT NULL,
    Percentage REAL NOT NULL,
    Division TEXT NOT NULL, --Dist/I/II/II & if not pass in all subs, May be SP or F
    Rank INTEGER,
    ResultStatus TEXT NOT NULL, --Pass/Simple
    Creation_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    Last_Modified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (StudentId) REFERENCES Students(Id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (AcademicYearId) REFERENCES AcademicYears(Id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (ActiveExamId) REFERENCES ActiveExams(Id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE(StudentId, ActiveExamId)
);

-- ReportCards Table
CREATE TABLE IF NOT EXISTS ReportCards (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    StudentId INTEGER NOT NULL,
    ActiveExamId INTEGER NOT NULL,
    AcademicYearId INTEGER NOT NULL,
    ReportCardData TEXT NOT NULL,
    Creation_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    Last_Modified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (StudentId) REFERENCES Students(Id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (AcademicYearId) REFERENCES AcademicYears(Id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- ========== INDEXES ========== --
-- For faster result generation
CREATE INDEX IF NOT EXISTS idx_marks_exam_year ON Marks(ActiveExamId, AcademicYearId);
CREATE INDEX IF NOT EXISTS idx_cumulative_exam_year ON CumulativeMarks(ActiveExamId, AcademicYearId);
CREATE INDEX IF NOT EXISTS idx_admissions_student_year ON Admissions(StudentId, AcademicYearId);
CREATE INDEX IF NOT EXISTS idx_class_subject_mapping ON ClassSubjectMapping(ClassId, SubjectId);

-- For general performance
CREATE INDEX IF NOT EXISTS idx_marks_student_subject ON Marks(StudentId, SubjectId);
CREATE INDEX IF NOT EXISTS idx_admissions_class_section ON Admissions(ClassId, SectionId, AcademicYearId);
CREATE INDEX IF NOT EXISTS idx_subjects_category ON Subjects(SubjectCategory);

-- ========== Preloaded Master DATA ========== --

-- Insert Users
INSERT INTO Users (Username, Password, Role) VALUES
    ('admin', 'admin123', 'Administrator'),
    ('principal', 'principal123', 'Principal'),
    ('teacher1', 'teacher123', 'Teacher'),
    ('deo', 'deo123', 'Admission');

-- Insert Academic Years
INSERT INTO AcademicYears (YearName, StartDate, EndDate, IsActive) VALUES
    ('2024-2025', '2024-04-01', '2025-03-31', 1);

-- Insert Classes (up to Class XI)
INSERT INTO Classes (ClassName) VALUES
    ('KG-I'), ('KG-II'), ('I'), ('II'), ('III'), ('IV'), ('V'),
    ('VI'), ('VII'), ('VIII'), ('IX'), ('X'), ('XI');

-- Insert Sections
INSERT INTO Sections (SectionName) VALUES ('A'), ('B');

-- Insert Class-Section Mappings (for all classes)
INSERT INTO ClassSectionMapping (ClassId, SectionId)
SELECT c.Id, s.Id FROM Classes c, Sections s
WHERE c.ClassName IN ('KG-I', 'KG-II', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI')
ORDER BY c.Id, s.Id;

-- Insert Subjects
INSERT INTO Subjects (SubjectName, SubjectCategory) VALUES
    ('MATHEMATICS', 'Major'),
    ('ENGLISH', 'Major'),
    ('ENGLISH - I', 'Major'),
    ('ENGLISH - II', 'Major'),
    ('LANGUAGE', 'Major'),
    ('SCIENCE', 'Major'),
    ('SOCIAL SCIENCE', 'Major'),
    ('EVS', 'Major'),
    ('HISTORY', 'Major'),
    ('POLITICAL SCIENCE', 'Major'),
    ('GEOGRAPHY', 'Major'),
    ('EDUCATION', 'Major'),
    ('ECONOMICS', 'Major'),
    ('GENERAL KNOWLEDGE', 'Minor'),
    ('MORAL SCIENCE', 'Minor'),
    ('COMPUTER', 'Minor'),
    ('ART EDUCATION', 'Minor'),
    ('CONVERSATION', 'Minor'),
    ('RHYMES', 'Minor'),
    ('SUPW', 'Co-Scholastic'),
    ('CCA', 'Co-Scholastic'),
    ('Games and sports', 'Co-Scholastic'),
    ('Cleanliness', 'Co-Scholastic'),
    ('Punctuality', 'Co-Scholastic'),
    ('Obedience', 'Co-Scholastic');

-- Insert Class-Subject Mappings for Class V and VI
--- Insert Class-Subject Mappings
-- KG-I
INSERT INTO ClassSubjectMapping (ClassId, SubjectId)
SELECT c.Id, s.Id FROM Classes c, Subjects s 
WHERE c.ClassName = 'KG-I' AND s.SubjectName IN 
('MATHEMATICS', 'ENGLISH', 'EVS', 'GENERAL KNOWLEDGE', 'CONVERSATION', 'RHYMES');

-- KG-II
INSERT INTO ClassSubjectMapping (ClassId, SubjectId)
SELECT c.Id, s.Id FROM Classes c, Subjects s 
WHERE c.ClassName = 'KG-II' AND s.SubjectName IN 
('MATHEMATICS', 'ENGLISH', 'EVS', 'GENERAL KNOWLEDGE', 'CONVERSATION', 'RHYMES');

-- Class I
INSERT INTO ClassSubjectMapping (ClassId, SubjectId)
SELECT c.Id, s.Id FROM Classes c, Subjects s 
WHERE c.ClassName = 'I' AND s.SubjectName IN 
('MATHEMATICS', 'EVS', 'GENERAL KNOWLEDGE', 'MORAL SCIENCE', 'ENGLISH', 'LANGUAGE', 'ART EDUCATION');

-- Class II
INSERT INTO ClassSubjectMapping (ClassId, SubjectId)
SELECT c.Id, s.Id FROM Classes c, Subjects s 
WHERE c.ClassName = 'II' AND s.SubjectName IN 
('MATHEMATICS', 'EVS', 'GENERAL KNOWLEDGE', 'MORAL SCIENCE', 'ENGLISH', 'LANGUAGE', 'ART EDUCATION');

-- Class III
INSERT INTO ClassSubjectMapping (ClassId, SubjectId)
SELECT c.Id, s.Id FROM Classes c, Subjects s 
WHERE c.ClassName = 'III' AND s.SubjectName IN 
('MATHEMATICS', 'LANGUAGE', 'ENGLISH - I', 'ENGLISH - II', 'MORAL SCIENCE', 'SCIENCE', 'EVS', 'GENERAL KNOWLEDGE', 'ART EDUCATION');

-- Class IV
INSERT INTO ClassSubjectMapping (ClassId, SubjectId)
SELECT c.Id, s.Id FROM Classes c, Subjects s 
WHERE c.ClassName = 'IV' AND s.SubjectName IN 
('MATHEMATICS', 'LANGUAGE', 'ENGLISH - I', 'ENGLISH - II', 'MORAL SCIENCE', 'SCIENCE', 'EVS', 'GENERAL KNOWLEDGE', 'ART EDUCATION', 'COMPUTER');

-- Class V
INSERT INTO ClassSubjectMapping (ClassId, SubjectId)
SELECT c.Id, s.Id FROM Classes c, Subjects s 
WHERE c.ClassName = 'V' AND s.SubjectName IN 
('MATHEMATICS', 'LANGUAGE', 'ENGLISH - I', 'ENGLISH - II', 'MORAL SCIENCE', 'SCIENCE', 'EVS', 'GENERAL KNOWLEDGE', 'ART EDUCATION', 'COMPUTER');

-- Class VI
INSERT INTO ClassSubjectMapping (ClassId, SubjectId)
SELECT c.Id, s.Id FROM Classes c, Subjects s 
WHERE c.ClassName = 'VI' AND s.SubjectName IN 
('MATHEMATICS', 'LANGUAGE', 'ENGLISH - I', 'ENGLISH - II', 'MORAL SCIENCE', 'SCIENCE', 'SOCIAL SCIENCE', 'COMPUTER');

-- Class VII
INSERT INTO ClassSubjectMapping (ClassId, SubjectId)
SELECT c.Id, s.Id FROM Classes c, Subjects s 
WHERE c.ClassName = 'VII' AND s.SubjectName IN 
('MATHEMATICS', 'LANGUAGE', 'ENGLISH - I', 'ENGLISH - II', 'MORAL SCIENCE', 'SCIENCE', 'SOCIAL SCIENCE', 'COMPUTER');

-- Class VIII
INSERT INTO ClassSubjectMapping (ClassId, SubjectId)
SELECT c.Id, s.Id FROM Classes c, Subjects s 
WHERE c.ClassName = 'VIII' AND s.SubjectName IN 
('MATHEMATICS', 'LANGUAGE', 'ENGLISH - I', 'ENGLISH - II', 'MORAL SCIENCE', 'SCIENCE', 'SOCIAL SCIENCE', 'COMPUTER');

-- Class IX
INSERT INTO ClassSubjectMapping (ClassId, SubjectId)
SELECT c.Id, s.Id FROM Classes c, Subjects s 
WHERE c.ClassName = 'IX' AND s.SubjectName IN 
('MATHEMATICS', 'LANGUAGE', 'ENGLISH', 'SCIENCE', 'SOCIAL SCIENCE');

-- Class X
INSERT INTO ClassSubjectMapping (ClassId, SubjectId)
SELECT c.Id, s.Id FROM Classes c, Subjects s 
WHERE c.ClassName = 'X' AND s.SubjectName IN 
('MATHEMATICS', 'LANGUAGE', 'ENGLISH', 'SCIENCE', 'SOCIAL SCIENCE');

-- Class XI
INSERT INTO ClassSubjectMapping (ClassId, SubjectId)
SELECT c.Id, s.Id FROM Classes c, Subjects s 
WHERE c.ClassName = 'XI' AND s.SubjectName IN 
('ENGLISH', 'POLITICAL SCIENCE', 'HISTORY', 'GEOGRAPHY', 'EDUCATION', 'ECONOMICS');


-- Insert Exams
INSERT INTO Exams (ExamName, Description) VALUES
    ('First Periodic Test', 'First periodic assessment of the term'),
    ('Half Yearly Exam', 'Mid-term comprehensive examination'),
    ('Second Periodic Test', 'Second periodic assessment of the term'),
    ('Annual Exam', 'Final annual examination');

-- Insert Active Exams
INSERT INTO ActiveExams (AcademicYearId, ExamId, MajorMaxMark, MinorMaxMark, IsActive, Result_Published)
SELECT 
    (SELECT Id FROM AcademicYears WHERE IsActive = 1),
    (SELECT Id FROM Exams WHERE ExamName = 'First Periodic Test'),
    20, 10, 1, 0;

INSERT INTO ActiveExams (AcademicYearId, ExamId, MajorMaxMark, MinorMaxMark, IsActive, Result_Published)
SELECT 
    (SELECT Id FROM AcademicYears WHERE IsActive = 1),
    (SELECT Id FROM Exams WHERE ExamName = 'Half Yearly Exam'),
    80, 20, 0, 0;



-- Sample Student
INSERT INTO Students (
    Name, Gender, fathersName, mothersName, DOB,
    Aadhaar, APAR, PEN, Contact, Address,
    Status, Caste, Religion,
    Height, Weight, BloodGroup
) VALUES (
    'Rahul Sharma', 'Male', 'Rajesh Sharma', 'Priya Sharma', '2010-05-15',
    '123456789012', '123456789012', '98765432109', '9876543210', '12 Gandhi Nagar, Delhi',
    'Admitted', 'General', 'Hindu',
    145, 42.5, 'B+'
);

-- Sample Admission Record
INSERT INTO Admissions (
    StudentId, AcademicYearId, ClassId, SectionId, RollNo, AdmissionType
) VALUES (
    (SELECT Id FROM Students WHERE PEN = '98765432109'),
    (SELECT Id FROM AcademicYears WHERE IsActive = 1),
    (SELECT Id FROM Classes WHERE ClassName = 'V'),
    (SELECT Id FROM Sections WHERE SectionName = 'A'),
    1,
    'New'
);

