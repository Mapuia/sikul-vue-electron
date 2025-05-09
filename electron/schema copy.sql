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
    Description TEXT
    Creation_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    Modified_at DATETIME DEFAULT CURRENT_TIMESTAMP
        
);

-- ActiveExam Table (Fixed)
CREATE TABLE IF NOT EXISTS ActiveExam (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,   
    AcademicYearId INTEGER NOT NULL,
    ExamId INTEGER NOT NULL,
    MajorMaxMark REAL NOT NULL,
    MinorMaxMark REAL NOT NULL,
    CoScholasticMaxMark REAL,    
    IsActive INTEGER DEFAULT 0 CHECK(IsActive IN (0, 1)),
    Publishable INTEGER DEFAULT 0 CHECK(Publishable IN (0, 1)),
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
    fathersName TEXT,
    mothersName TEXT,
    DOB DATE,
    Aadhaar TEXT UNIQUE,
    APAR TEXT UNIQUE,
    PEN TEXT UNIQUE,
    Contact TEXT CHECK(length(Contact) = 10 AND Contact GLOB '[0-9]*'),
    Address TEXT,
    FirstAdmissionDate DATE DEFAULT CURRENT_TIMESTAMP,
    Status TEXT NOT NULL DEFAULT 'Admitted',
    Caste TEXT,
    Religion TEXT,
    Height INTEGER CHECK(Height > 0 AND Height < 250),
    Weight REAL CHECK(Weight > 0 AND Weight < 200),
    BloodGroup TEXT CHECK(BloodGroup IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    Creation_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    Modified_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Admission Table
CREATE TABLE IF NOT EXISTS Admission (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    StudentId INTEGER NOT NULL,
    AcademicYearId INTEGER NOT NULL,
    ClassId INTEGER NOT NULL,
    SectionId INTEGER NOT NULL,
    RollNo INTEGER ,
    AdmissionType TEXT NOT NULL CHECK(AdmissionType IN ('New', 'Re-admission', 'Transfer')),
    Creation_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    Modified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
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
    MaxMarks REAL NOT NULL,
    MarksObtained REAL NOT NULL,
    Creation_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    Modified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (StudentId) REFERENCES Students(Id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (SubjectId) REFERENCES Subjects(Id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (ActiveExamId) REFERENCES ActiveExam(Id) ON DELETE CASCADE ON UPDATE CASCADE,
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
    Modified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (StudentId) REFERENCES Students(Id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (SubjectId) REFERENCES Subjects(Id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (ActiveExamId) REFERENCES ActiveExam(Id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (AcademicYearId) REFERENCES AcademicYears(Id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE(StudentId, SubjectId, ActiveExamId)
);

-- CumulativeMarks Table (Fixed)
CREATE TABLE IF NOT EXISTS CumulativeMarks (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    StudentId INTEGER NOT NULL,
    SubjectId INTEGER NOT NULL,
    CumulativeTypeId INTEGER NOT NULL,
    TotalMaxMarks REAL DEFAULT 0, 
    TotalMarksObtained REAL DEFAULT 0,
    AcademicYearId INTEGER NOT NULL,
    Creation_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    Modified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (StudentId) REFERENCES Students(Id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (SubjectId) REFERENCES Subjects(Id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (AcademicYearId) REFERENCES AcademicYears(Id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE(StudentId, SubjectId, CumulativeTypeId)
);

-- Results Table (Fixed)
CREATE TABLE IF NOT EXISTS Results (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    AcademicYearId INTEGER NOT NULL,
    StudentId INTEGER NOT NULL,
    ActiveExamId INTEGER NOT NULL, 
    TotalMaxMark REAL NOT NULL,
    TotalMarksObtained REAL NOT NULL,
    Percentage REAL NOT NULL,
    Division TEXT NOT NULL, --Dist/I/II/II & if not pass in all subs, May be SP or F
    Rank INTEGER,
    ResultStatus TEXT NOT NULL, --Pass/Simple
    Published INTEGER DEFAULT 0,
    Creation_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    Modified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (StudentId) REFERENCES Students(Id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (AcademicYearId) REFERENCES AcademicYears(Id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (ActiveExamId) REFERENCES ActiveExam(Id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE(StudentId, ActiveExamId)
);

-- ReportCards Table
CREATE TABLE IF NOT EXISTS ReportCards (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    StudentId INTEGER NOT NULL,
    AcademicYearId INTEGER NOT NULL,
    ReportCardData TEXT NOT NULL,
    Creation_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    Modified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (StudentId) REFERENCES Students(Id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (AcademicYearId) REFERENCES AcademicYears(Id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- ========== INDEXES ========== --

-- Basic indexes
CREATE INDEX IF NOT EXISTS idx_AcademicYears_Year ON AcademicYears(YearName);
CREATE INDEX IF NOT EXISTS idx_AcademicYears_IsActive ON AcademicYears(IsActive);
CREATE INDEX IF NOT EXISTS idx_Classes_Name ON Classes(ClassName);
CREATE INDEX IF NOT EXISTS idx_Sections_Name ON Sections(SectionName);
CREATE INDEX IF NOT EXISTS idx_Subjects_Name ON Subjects(SubjectName);
CREATE INDEX IF NOT EXISTS idx_Subjects_Category ON Subjects(SubjectCategory);
CREATE INDEX IF NOT EXISTS idx_Exams_Name ON Exams(ExamName);
CREATE INDEX IF NOT EXISTS idx_Students_Name ON Students(Name);
CREATE INDEX IF NOT EXISTS idx_Students_Aadhaar ON Students(Aadhaar);
CREATE INDEX IF NOT EXISTS idx_Students_Status ON Students(Status);
CREATE INDEX IF NOT EXISTS idx_Students_PEN ON Students(PEN);
CREATE INDEX IF NOT EXISTS idx_Students_Contact ON Students(Contact);

-- Foreign key indexes
CREATE INDEX IF NOT EXISTS idx_ClassSectionMapping_Class ON ClassSectionMapping(ClassId);
CREATE INDEX IF NOT EXISTS idx_ClassSectionMapping_Section ON ClassSectionMapping(SectionId);
CREATE INDEX IF NOT EXISTS idx_ClassSubjectMapping_Class ON ClassSubjectMapping(ClassId);
CREATE INDEX IF NOT EXISTS idx_ClassSubjectMapping_Subject ON ClassSubjectMapping(SubjectId);
CREATE INDEX IF NOT EXISTS idx_ActiveExam_AcademicYear ON ActiveExam(AcademicYearId);
CREATE INDEX IF NOT EXISTS idx_ActiveExam_Exam ON ActiveExam(ExamId);

-- Admission indexes
CREATE INDEX IF NOT EXISTS idx_Admission_Student ON Admission(StudentId);
CREATE INDEX IF NOT EXISTS idx_Admission_Class ON Admission(ClassId);
CREATE INDEX IF NOT EXISTS idx_Admission_Section ON Admission(SectionId);
CREATE INDEX IF NOT EXISTS idx_Admission_AcademicYear ON Admission(AcademicYearId);
CREATE INDEX IF NOT EXISTS idx_Admission_RollNo ON Admission(RollNo);
CREATE INDEX IF NOT EXISTS idx_Admission_Class_Section_Year ON Admission(ClassId, SectionId, AcademicYearId);

-- Marks indexes
CREATE INDEX IF NOT EXISTS idx_Marks_Student ON Marks(StudentId);
CREATE INDEX IF NOT EXISTS idx_Marks_Subject ON Marks(SubjectId);
CREATE INDEX IF NOT EXISTS idx_Marks_ActiveExam ON Marks(ActiveExamId);
CREATE INDEX IF NOT EXISTS idx_Marks_AcademicYear ON Marks(AcademicYearId);
CREATE INDEX IF NOT EXISTS idx_Marks_Student_Subject_Exam ON Marks(StudentId, SubjectId, ActiveExamId);

-- Results indexes
CREATE INDEX IF NOT EXISTS idx_Results_Student ON Results(StudentId);
CREATE INDEX IF NOT EXISTS idx_Results_ActiveExam ON Results(ActiveExamId);
CREATE INDEX IF NOT EXISTS idx_Results_AcademicYear ON Results(AcademicYearId);
CREATE INDEX IF NOT EXISTS idx_Results_Percentage ON Results(Percentage);
CREATE INDEX IF NOT EXISTS idx_Results_Published ON Results(Published);

-- ReportCards indexes
CREATE INDEX IF NOT EXISTS idx_ReportCards_Student ON ReportCards(StudentId);
CREATE INDEX IF NOT EXISTS idx_ReportCards_AcademicYear ON ReportCards(AcademicYearId);

-- Composite indexes for performance
CREATE INDEX IF NOT EXISTS idx_Student_Class_Section ON Admission(StudentId, ClassId, SectionId);
CREATE INDEX IF NOT EXISTS idx_Marks_Student_Year ON Marks(StudentId, AcademicYearId);
CREATE INDEX IF NOT EXISTS idx_Results_Student_Year ON Results(StudentId, AcademicYearId);

-- ========== SAMPLE DATA ========== --

-- Insert Users
INSERT INTO Users (Username, Password, Role) VALUES
    ('admin', 'admin123', 'Administrator'),
    ('principal', 'principal123', 'Principal'),
    ('teacher1', 'teacher123', 'Teacher'),
    ('deo', 'deo123', 'Admission');

-- Insert Academic Years
INSERT INTO AcademicYears (YearName, StartDate, EndDate, IsActive) VALUES
    ('2024-2025', '2024-04-01', '2025-03-31', 1);

-- Insert Classes
INSERT INTO Classes (ClassName) VALUES
    ('KG-I'), ('KG-II'), ('I'), ('II'), ('III'), ('IV'), ('V'),
    ('VI'), ('VII'), ('VIII'), ('IX'), ('X'), ('XI'), ('XII');

-- Insert Sections
INSERT INTO Sections (SectionName) VALUES ('A'), ('B');

-- Insert Class-Section Mappings
INSERT INTO ClassSectionMapping (ClassId, SectionId)
SELECT c.Id, s.Id FROM Classes c, Sections s
WHERE c.ClassName IN ('KG-I', 'KG-II', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII')
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
    ('POLITICAL SCIENCE', 'Major'),
    ('HISTORY', 'Major'),
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

-- Insert Class-Subject Mappings
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

-- Class XII
INSERT INTO ClassSubjectMapping (ClassId, SubjectId)
SELECT c.Id, s.Id FROM Classes c, Subjects s 
WHERE c.ClassName = 'XII' AND s.SubjectName IN 
('ENGLISH', 'POLITICAL SCIENCE', 'HISTORY', 'GEOGRAPHY', 'EDUCATION', 'ECONOMICS');

-- Insert Exams
INSERT INTO Exams (ExamName, Description) VALUES
    ('First Periodic Test', 'First periodic assessment of the term'),
    ('Half Yearly Exam', 'Mid-term comprehensive examination'),
    ('Second Periodic Test', 'Second periodic assessment of the term'),
    ('Annual Exam', 'Final annual examination');

-- Insert Active Exams (Fixed)
INSERT INTO ActiveExam (AcademicYearId, ExamId, ExamName, MajorMaxMark, MinorMaxMark, CoScholasticMaxMark, IsActive, Publishable, Result_Published)
SELECT 
    (SELECT Id FROM AcademicYears WHERE IsActive = 1),
    (SELECT Id FROM Exams WHERE ExamName = 'First Periodic Test'),
    'First Periodic Test',
    20, 10, 10, 1, 0, 0;

INSERT INTO ActiveExam (AcademicYearId, ExamId, ExamName, MajorMaxMark, MinorMaxMark, CoScholasticMaxMark, IsActive, Publishable, Result_Published)
SELECT 
    (SELECT Id FROM AcademicYears WHERE IsActive = 1),
    (SELECT Id FROM Exams WHERE ExamName = 'Half Yearly Exam'),
    'Half Yearly Exam',
    80, 20, 30, 0, 1, 0;

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
INSERT INTO Admission (
    StudentId, AcademicYearId, ClassId, SectionId, RollNo, AdmissionType
) VALUES (
    (SELECT Id FROM Students WHERE PEN = '98765432109'),
    (SELECT Id FROM AcademicYears WHERE IsActive = 1),
    (SELECT Id FROM Classes WHERE ClassName = 'V'),
    (SELECT Id FROM Sections WHERE SectionName = 'A'),
    1,
    'New'
);