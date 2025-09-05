--30.08.2025
-- Users Table
CREATE TABLE IF NOT EXISTS Users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,    
    Creation_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    Last_Modified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    Last_Login DATETIME
);

-- AcademicYears Table
CREATE TABLE IF NOT EXISTS AcademicYears (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    YearName TEXT NOT NULL UNIQUE,
    StartDate DATE NOT NULL,
    EndDate DATE NOT NULL,
    IsActive BOOLEAN DEFAULT 0,
    Creation_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CHECK (EndDate > StartDate)
);

-- Classes Table
CREATE TABLE IF NOT EXISTS Classes (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    ClassId TEXT UNIQUE,
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
    ClassId INTEGER NOT NULL,
    SectionId INTEGER NOT NULL,
    Creation_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ClassId) REFERENCES Classes(Id) ON DELETE CASCADE,
    FOREIGN KEY (SectionId) REFERENCES Sections(Id) ON DELETE CASCADE,
    UNIQUE(ClassId, SectionId)
);

-- Subjects Table
CREATE TABLE IF NOT EXISTS Subjects (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    SubjectCode TEXT UNIQUE,
    SubjectName TEXT UNIQUE,
    SubjectCategory TEXT NOT NULL, -- CHECK(SubjectCategory IN ('Major', 'Minor', 'Co-Scholastic')),
    FullMark DECIMAL(5,2),
    IsCore BOOLEAN DEFAULT 0,
    DisplayOrder INTEGER,
    Creation_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    Last_Modified_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ClassSubjectMapping Table
CREATE TABLE IF NOT EXISTS ClassSubjectMapping (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    ClassId INTEGER NOT NULL,
    SubjectId INTEGER NOT NULL,
    Creation_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ClassId) REFERENCES Classes(Id) ON DELETE CASCADE,
    FOREIGN KEY (SubjectId) REFERENCES Subjects(Id) ON DELETE CASCADE,
    UNIQUE (ClassId, SubjectId)
);

-- Exams Table
CREATE TABLE IF NOT EXISTS Exams (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    ExamName TEXT NOT NULL UNIQUE,
    ExamType TEXT NOT NULL,
    Description TEXT,
    Creation_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    Modified_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ActiveExam Table


CREATE TABLE ActiveExams (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    AcademicYearId INTEGER NOT NULL,
    ExamId INTEGER NOT NULL,
    MajorMaxMark DECIMAL (5, 2) NOT NULL,
    MinorMaxMark DECIMAL (5, 2) NOT NULL,
    PassingPercentage DECIMAL (5, 2) DEFAULT 40.0 CHECK (PassingPercentage BETWEEN 0 AND 100),
    IsActive BOOLEAN DEFAULT 0,
    Result_Published BOOLEAN DEFAULT 0,
    PublishDate DATETIME,
    Creation_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    Modified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ExamId) REFERENCES Exams (Id) ON DELETE CASCADE,
    FOREIGN KEY (AcademicYearId) REFERENCES AcademicYears (Id) ON DELETE CASCADE,
    UNIQUE (AcademicYearId, ExamId)
);

-- Students Table
CREATE TABLE Students (
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
    Status TEXT NOT NULL DEFAULT 'Admitted',
    Caste TEXT,
    Religion TEXT,
    Height INTEGER,
    Weight DECIMAL (5, 2),
    BloodGroup TEXT,
    Creation_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    Last_Modified_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Admission Table
CREATE TABLE Admissions (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    StudentId TEXT NOT NULL,
    AcademicYearId INTEGER NOT NULL,
    ClassId INTEGER NOT NULL,
    SectionId INTEGER NOT NULL,
    RollNo INTEGER,
    AdmissionType TEXT NOT NULL,
    reAdmitted BOOLEAN DEFAULT 0,
    Creation_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    Last_Modified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (StudentId) REFERENCES Students (Id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (ClassId) REFERENCES Classes (Id) ON DELETE CASCADE,
    FOREIGN KEY (AcademicYearId) REFERENCES AcademicYears (Id) ON DELETE CASCADE,
    UNIQUE (AcademicYearId, ClassId, SectionId, RollNo),
    UNIQUE (StudentId, AcademicYearId)
);


-- Marks Table
CREATE TABLE IF NOT EXISTS Marks (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    ActiveExamId INTEGER NOT NULL,
    StudentId TEXT NOT NULL,
    SubjectId INTEGER NOT NULL,
    PeriodicMaxMark DECIMAL(5,2),
    TerminalMaxMark DECIMAL(5,2),
    TotalMaxMarks DECIMAL(5,2),
    PeriodicMarksObtained DECIMAL(5,2),    
    TerminalMarksObtained DECIMAL(5,2),
    TotalMarksObtained DECIMAL(5,2),
    SubjectResult TEXT,    
    Appeared BOOLEAN,
    Creation_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    Last_Modified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CreatedBy INTEGER REFERENCES Users(Id),
    ModifiedBy INTEGER REFERENCES Users(Id),
    FOREIGN KEY (StudentId) REFERENCES Students(Id) ON DELETE CASCADE,
    FOREIGN KEY (SubjectId) REFERENCES Subjects(Id) ON DELETE CASCADE,
    FOREIGN KEY (ActiveExamId) REFERENCES ActiveExams(Id) ON DELETE CASCADE,
    UNIQUE(StudentId, SubjectId, ActiveExamId)
);

-- Mark Entry Status
CREATE TABLE IF NOT EXISTS MarkEntryStatus (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    ActiveExamId INTEGER NOT NULL,
    ClassId INTEGER NOT NULL,
    SectionId INTEGER NOT NULL,
    SubjectId INTEGER NOT NULL,  
    FinishedEntry BOOLEAN DEFAULT 0,
    Remarks TEXT DEFAULT '',
    Creation_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    Last_Modified_at DATETIME DEFAULT CURRENT_TIMESTAMP,    
    FOREIGN KEY (ClassId) REFERENCES Classes(Id) ON DELETE CASCADE,    
    FOREIGN KEY (ActiveExamId) REFERENCES ActiveExams(Id) ON DELETE CASCADE,    
    FOREIGN KEY (SubjectId) REFERENCES Subjects(Id) ON DELETE CASCADE,  
    UNIQUE(ActiveExamId, ClassId, SectionId, SubjectId) 
);

-- CoScholasticMarks Table
CREATE TABLE IF NOT EXISTS CoScholasticMarks (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    ActiveExamId INTEGER NOT NULL,
    StudentId TEXT NOT NULL,
    SubjectId INTEGER NOT NULL,    
    Grade TEXT NOT NULL,
    Appeared BOOLEAN  DEFAULT 0,
    Remark TEXT,
    Creation_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    Last_Modified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CreatedBy INTEGER REFERENCES Users(Id),
    ModifiedBy INTEGER REFERENCES Users(Id),
    FOREIGN KEY (StudentId) REFERENCES Students(Id) ON DELETE CASCADE,
    FOREIGN KEY (SubjectId) REFERENCES Subjects(Id) ON DELETE CASCADE,
    FOREIGN KEY (ActiveExamId) REFERENCES ActiveExams(Id) ON DELETE CASCADE,
    UNIQUE(StudentId, SubjectId, ActiveExamId)
);

-- CumulativeTotalMarks Table
CREATE TABLE IF NOT EXISTS CumulativeTotalMarks (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    AcademicYearId INTEGER NOT NULL,
    ActiveExamId INTEGER NOT NULL,    
    StudentId TEXT NOT NULL,
    TotalMaxMarks DECIMAL(5,2) NOT NULL,
    TotalMarksObtained DECIMAL(5,2) NOT NULL DEFAULT 0,
    Percentage DECIMAL(5,2),    
    Creation_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    Last_Modified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (StudentId) REFERENCES Students(Id) ON DELETE CASCADE,
    FOREIGN KEY (AcademicYearId) REFERENCES AcademicYears(Id) ON DELETE CASCADE,
    UNIQUE(StudentId, ActiveExamId, AcademicYearId)
);

-- Final Cumulative Total Marks
CREATE TABLE IF NOT EXISTS FinalCumulativeTotalMarks (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    AcademicYearId INTEGER NOT NULL,
    StudentId TEXT NOT NULL,
    TotalMaxMarks DECIMAL(5,2) NOT NULL,
    TotalMarksObtained DECIMAL(5,2) NOT NULL DEFAULT 0,
    Percentage DECIMAL(5,2),    
    Creation_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    Last_Modified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (StudentId) REFERENCES Students(Id) ON DELETE CASCADE,
    FOREIGN KEY (AcademicYearId) REFERENCES AcademicYears(Id) ON DELETE CASCADE,
    UNIQUE(StudentId, AcademicYearId)
);

-- Results Table
CREATE TABLE IF NOT EXISTS Results (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    AcademicYearId INTEGER NOT NULL,
    StudentId TEXT NOT NULL,
    ActiveExamId INTEGER NOT NULL,
    TotalMaxMarks DECIMAL(5,2) NOT NULL,
    TotalMarksObtained DECIMAL(5,2) NOT NULL,
    Percentage DECIMAL(5,2) NOT NULL,
    Division TEXT,
    Rank INTEGER,
    ResultStatus TEXT NOT NULL CHECK(ResultStatus IN ('Pass', 'Fail', 'Simple Pass')),    
    ResultType TEXT NOT NULL, --terminal, final
    ReportCard BOOLEAN DEFAULT 0,
    Creation_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    Last_Modified_at DATETIME DEFAULT CURRENT_TIMESTAMP,    
    FOREIGN KEY (StudentId) REFERENCES Students(Id) ON DELETE CASCADE,
    FOREIGN KEY (AcademicYearId) REFERENCES AcademicYears(Id) ON DELETE CASCADE,
    UNIQUE(AcademicYearId, StudentId, ResultType)
);

--Result Creation Status
CREATE TABLE ResultStatus (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    AcademicYearId INTEGER NOT NULL,
    ActiveExamId INTEGER NOT NULL,
    ClassId INTEGER NOT NULL,
    SectionId INTEGER,
    ResultType TEXT NOT NULL,
    isGenerated BOOLEAN DEFAULT (1),
    isPublished BOOLEAN DEFAULT 0,
    Creation_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    Last_Modified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (AcademicYearId) REFERENCES AcademicYears (Id) ON DELETE CASCADE,
    FOREIGN KEY (ClassId) REFERENCES Classes (Id) ON DELETE CASCADE,
    UNIQUE (AcademicYearId, ActiveExamId, ClassId, SectionId)
);


-- ReportCards Table with Versioning
CREATE TABLE IF NOT EXISTS ReportCards (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    StudentId TEXT NOT NULL,
    AcademicYearId INTEGER NOT NULL,
    ActiveExamId INTEGER,  
    TotalWorkingDays INTEGER, 
    TotalPresentDays INTEGER,   
    ReportCardType TEXT NOT NULL, -- terminal, final
    TeachersRemark TEXT, 
    Creation_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    Last_Modified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (StudentId) REFERENCES Students(Id) ON DELETE CASCADE,
    FOREIGN KEY (AcademicYearId) REFERENCES AcademicYears(Id) ON DELETE CASCADE,
    FOREIGN KEY (ActiveExamId) REFERENCES ActiveExams(Id) ON DELETE CASCADE,
    UNIQUE (StudentId, AcademicYearId, ActiveExamId, ReportCardType)
);

-- Signatories Table
CREATE TABLE IF NOT EXISTS Signatories (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    ClassId INTEGER,
    SectionId INTEGER,
    SignatoryType TEXT NOT NULL,
    Designation TEXT NOT NULL,
    Name TEXT NOT NULL,
    SignatureImage TEXT,
    IsActive BOOLEAN DEFAULT TRUE,
    Creation_at DATETIME DEFAULT CURRENT_TIMESTAMP       
);

-- Foreign Key Indexes
-- Users
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON Users(Username);

-- AcademicYears
CREATE INDEX IF NOT EXISTS idx_academicyears_isactive ON AcademicYears(IsActive);

-- Students
CREATE UNIQUE INDEX IF NOT EXISTS idx_students_Id ON Students(Id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_students_aadhaar_not_null 
    ON Students(Aadhaar) WHERE Aadhaar IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_students_apar_not_null 
    ON Students(APAR) WHERE APAR IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_students_pen_not_null 
    ON Students(PEN) WHERE PEN IS NOT NULL;

-- Admissions
CREATE INDEX IF NOT EXISTS idx_admissions_student_id ON Admissions(StudentId);
CREATE INDEX IF NOT EXISTS idx_admissions_academic_year_id ON Admissions(AcademicYearId);
CREATE INDEX IF NOT EXISTS idx_admissions_class_id ON Admissions(ClassId);
CREATE INDEX IF NOT EXISTS idx_admissions_section_id ON Admissions(SectionId);



-- ClassSectionMapping
CREATE INDEX IF NOT EXISTS idx_classsectionmapping_classid ON ClassSectionMapping(ClassId);
CREATE INDEX IF NOT EXISTS idx_classsectionmapping_sectionid ON ClassSectionMapping(SectionId);

-- ClassSubjectMapping
CREATE INDEX IF NOT EXISTS idx_classsubjectmapping_classid ON ClassSubjectMapping(ClassId);
CREATE INDEX IF NOT EXISTS idx_classsubjectmapping_subjectid ON ClassSubjectMapping(SubjectId);

-- Marks
CREATE INDEX IF NOT EXISTS idx_marks_subject_id ON Marks(SubjectId);
CREATE INDEX IF NOT EXISTS idx_marks_active_exam_id ON Marks(ActiveExamId);

-- CoScholasticMarks
CREATE INDEX IF NOT EXISTS idx_coscholasticmarks_subject_id ON CoScholasticMarks(SubjectId);
CREATE INDEX IF NOT EXISTS idx_coscholasticmarks_active_exam_id ON CoScholasticMarks(ActiveExamId);

-- CumulativeTotalMarks
CREATE INDEX IF NOT EXISTS idx_cumulativemarks_student_id ON CumulativeTotalMarks(StudentId);
CREATE INDEX IF NOT EXISTS idx_cumulativemarks_active_exam_id ON CumulativeTotalMarks(ActiveExamId);
-- FinalCumulativeTotalMarks
CREATE INDEX IF NOT EXISTS idx_finalcumulativemarks_student_id ON FinalCumulativeTotalMarks(StudentId);


-- Results
CREATE INDEX IF NOT EXISTS idx_results_student_id ON Results(StudentId);
CREATE INDEX IF NOT EXISTS idx_results_active_exam_id ON Results(ActiveExamId);

-- ReportCards
CREATE INDEX IF NOT EXISTS idx_reportcards_student_id ON ReportCards(StudentId);
CREATE INDEX IF NOT EXISTS idx_reportcards_active_exam_id ON ReportCards(ActiveExamId);

-- MarkEntryStatus
CREATE INDEX IF NOT EXISTS idx_markentrystatus_class_id ON MarkEntryStatus(ClassId);
CREATE INDEX IF NOT EXISTS idx_markentrystatus_section_id ON MarkEntryStatus(SectionId);
CREATE INDEX IF NOT EXISTS idx_markentrystatus_active_exam_id ON MarkEntryStatus(ActiveExamId);

-- ActiveExams
CREATE INDEX IF NOT EXISTS idx_activeexams_academicyearid ON ActiveExams(AcademicYearId);
CREATE INDEX IF NOT EXISTS idx_activeexams_examid ON ActiveExams(ExamId);
CREATE INDEX IF NOT EXISTS idx_activeexams_isactive ON ActiveExams(IsActive);


-- ========== Preloaded Master DATA ========== --


-- Insert Academic Years
INSERT INTO AcademicYears (YearName, StartDate, EndDate, IsActive) VALUES
    ('2024-2025', '2024-04-01', '2025-03-31', 1);

-- Insert Classes (up to Class XI)
INSERT INTO Classes (ClassId, ClassName) VALUES
    ('KG1', 'KG-I'), ('KG2', 'KG-II'), ('1', 'I'), ('2', 'II'), ('3', 'III'), ('4', 'IV'), ('5', 'V'), ('6', 'VI'), ('7', 'VII'), ('8', 'VIII'), ('9', 'IX'), ('10', 'X'), ('11', 'XI');


-- Insert Sections
INSERT INTO Sections (SectionName) VALUES ('A'), ('B');

-- Insert Class-Section Mappings (for all classes)
INSERT INTO ClassSectionMapping (ClassId, SectionId)
SELECT c.Id, s.Id FROM Classes c, Sections s
WHERE c.ClassName IN ('KG-I', 'KG-II', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X')
ORDER BY c.Id, s.Id;

-- Insert Subjects
INSERT INTO Subjects (SubjectCode, SubjectName, SubjectCategory, FullMark, IsCore, DisplayOrder) VALUES
('ENG', 'English', 'Major', 100, 0, 1),
('ENGI', 'English-I', 'Major', 100, 0, 2),
('ENGII', 'English-II', 'Major', 100, 0, 3),
('LANG', 'Language', 'Major', 100, 0, 4),
('EVS', 'EVS', 'Major', 100, 0, 5),
('SCI', 'Science', 'Major', 100, 1, 6),
('MATH', 'Mathematics', 'Major', 100, 1, 7),
('SOCSCI', 'Social Science', 'Major', 100, 0, 8),
('HIST', 'History', 'Major', 100, 0, 9),
('POLSCI', 'Pol. Science.', 'Major', 100, 0, 10),
('GEOG', 'Geography', 'Major', 100, 0, 11),
('EDU', 'Education', 'Major', 100, 0, 12),
('ECON', 'Economics', 'Major', 100, 0, 13),
('GK', 'GK', 'Minor', 50, 0, 14),
('MORAL', 'Moral Science', 'Minor', 50, 0, 15),
('COMP', 'Computer', 'Minor', 50, 0, 16),
('ART', 'Art Education', 'Minor', 50, 0, 17),
('CONV', 'Conversation', 'Minor', 50, 0, 18),
('RHY', 'Rhymes', 'Minor', 50, 0, 19),
('SUPW', 'SUPW', 'Co-Scholastic', 50, 0, 20),
('CCA', 'CCA', 'Co-Scholastic', 50, 0, 21),
('GAME', 'Games & Sports', 'Co-Scholastic', 50, 0, 22),
('CLEAN', 'Cleanliness', 'Co-Scholastic', 50, 0, 23),
('PUNC', 'Punctuality', 'Co-Scholastic', 50, 0, 24),
('OBEY', 'Obedience', 'Co-Scholastic', 50, 0, 25);


-- Insert Class-Subject Mappings for Class V and VI
--- Insert Class-Subject Mappings
-- KG-I
-- KG-I
INSERT INTO ClassSubjectMapping (ClassId, SubjectId)
SELECT c.Id, s.Id FROM Classes c, Subjects s 
WHERE c.ClassName = 'KG-I' AND s.SubjectName IN 
('Mathematics', 'English', 'EVS', 'GK', 'Conversation', 'Rhymes');

-- KG-II
INSERT INTO ClassSubjectMapping (ClassId, SubjectId)
SELECT c.Id, s.Id FROM Classes c, Subjects s 
WHERE c.ClassName = 'KG-II' AND s.SubjectName IN 
('Mathematics', 'English', 'EVS', 'GK', 'Conversation', 'Rhymes');

-- Class I
INSERT INTO ClassSubjectMapping (ClassId, SubjectId)
SELECT c.Id, s.Id FROM Classes c, Subjects s 
WHERE c.ClassName = 'I' AND s.SubjectName IN 
('Mathematics', 'EVS', 'GK', 'Moral Science', 'English', 'Language', 'Art Education');

-- Class II
INSERT INTO ClassSubjectMapping (ClassId, SubjectId)
SELECT c.Id, s.Id FROM Classes c, Subjects s 
WHERE c.ClassName = 'II' AND s.SubjectName IN 
('Mathematics', 'EVS', 'GK', 'Moral Science', 'English', 'Language', 'Art Education');

-- Class III
INSERT INTO ClassSubjectMapping (ClassId, SubjectId)
SELECT c.Id, s.Id FROM Classes c, Subjects s 
WHERE c.ClassName = 'III' AND s.SubjectName IN 
('Mathematics', 'Language', 'English-I', 'English-II', 'Moral Science', 'Science', 'EVS', 'GK', 'Art Education');

-- Class IV
INSERT INTO ClassSubjectMapping (ClassId, SubjectId)
SELECT c.Id, s.Id FROM Classes c, Subjects s 
WHERE c.ClassName = 'IV' AND s.SubjectName IN 
('Mathematics', 'Language', 'English-I', 'English-II', 'Moral Science', 'Science', 'EVS', 'GK', 'Art Education', 'Computer');

-- Class V
INSERT INTO ClassSubjectMapping (ClassId, SubjectId)
SELECT c.Id, s.Id FROM Classes c, Subjects s 
WHERE c.ClassName = 'V' AND s.SubjectName IN 
('Mathematics', 'Language', 'English-I', 'English-II', 'Moral Science', 'Science', 'EVS', 'GK', 'Art Education', 'Computer');

-- Class VI
INSERT INTO ClassSubjectMapping (ClassId, SubjectId)
SELECT c.Id, s.Id FROM Classes c, Subjects s 
WHERE c.ClassName = 'VI' AND s.SubjectName IN 
('Mathematics', 'Language', 'English-I', 'English-II', 'Moral Science', 'Science', 'Social Science', 'Computer');

-- Class VII
INSERT INTO ClassSubjectMapping (ClassId, SubjectId)
SELECT c.Id, s.Id FROM Classes c, Subjects s 
WHERE c.ClassName = 'VII' AND s.SubjectName IN 
('Mathematics', 'Language', 'English-I', 'English-II', 'Moral Science', 'Science', 'Social Science', 'Computer');

-- Class VIII
INSERT INTO ClassSubjectMapping (ClassId, SubjectId)
SELECT c.Id, s.Id FROM Classes c, Subjects s 
WHERE c.ClassName = 'VIII' AND s.SubjectName IN 
('Mathematics', 'Language', 'English-I', 'English-II', 'Moral Science', 'Science', 'Social Science', 'Computer');

-- Class IX
INSERT INTO ClassSubjectMapping (ClassId, SubjectId)
SELECT c.Id, s.Id FROM Classes c, Subjects s 
WHERE c.ClassName = 'IX' AND s.SubjectName IN 
('Mathematics', 'Language', 'English', 'Science', 'Social Science');

-- Class X
INSERT INTO ClassSubjectMapping (ClassId, SubjectId)
SELECT c.Id, s.Id FROM Classes c, Subjects s 
WHERE c.ClassName = 'X' AND s.SubjectName IN 
('Mathematics', 'Language', 'English', 'Science', 'Social Science');

-- Class XI
INSERT INTO ClassSubjectMapping (ClassId, SubjectId)
SELECT c.Id, s.Id FROM Classes c, Subjects s 
WHERE c.ClassName = 'XI' AND s.SubjectName IN 
('English', 'Political Science', 'History', 'Geography', 'Education', 'Economics');

-- Insert Exams
INSERT INTO Exams (ExamName, ExamType, Description) VALUES
    ('First Periodic Test', 'periodic', 'First periodic assessment of the term'),
    ('Half Yearly Examination', 'terminal', 'Mid-term comprehensive examination'),
    ('Second Periodic Test', 'periodic', 'Second periodic assessment of the term'),
    ('Annual Examination', 'annual', 'Final annual examination'),
    ('Selection Test', 'selection', 'Selection Test for Class X students for Board Exam');

-- Insert Active Exams
INSERT INTO ActiveExams (AcademicYearId, ExamId, MajorMaxMark, MinorMaxMark, PassingPercentage, IsActive, Result_Published)
SELECT 
    (SELECT Id FROM AcademicYears WHERE IsActive = 1),
    (SELECT Id FROM Exams WHERE ExamName = 'First Periodic Test'),
    40, 10, 40, 0, 0;

INSERT INTO ActiveExams (AcademicYearId, ExamId, MajorMaxMark, MinorMaxMark, PassingPercentage, IsActive, Result_Published)
SELECT 
    (SELECT Id FROM AcademicYears WHERE IsActive = 1),
    (SELECT Id FROM Exams WHERE ExamName = 'Half Yearly Examination'),
    80, 20, 40, 0, 0;

INSERT INTO ActiveExams (AcademicYearId, ExamId, MajorMaxMark, MinorMaxMark, PassingPercentage, IsActive, Result_Published)
SELECT 
    (SELECT Id FROM AcademicYears WHERE IsActive = 1),
    (SELECT Id FROM Exams WHERE ExamName = 'Second Periodic Test'),
    40, 10, 40, 0, 0;

INSERT INTO ActiveExams (AcademicYearId, ExamId, MajorMaxMark, MinorMaxMark, PassingPercentage, IsActive, Result_Published)
SELECT 
    (SELECT Id FROM AcademicYears WHERE IsActive = 1),
    (SELECT Id FROM Exams WHERE ExamName = 'Annual Examination'),
    80, 20, 40, 0, 0;

INSERT INTO ActiveExams (AcademicYearId, ExamId, MajorMaxMark, MinorMaxMark, PassingPercentage, IsActive, Result_Published)
SELECT 
    (SELECT Id FROM AcademicYears WHERE IsActive = 1),
    (SELECT Id FROM Exams WHERE ExamName = 'Selection Test'),
    80, 20, 40, 0, 0;


-- Students for Classes X, Sections A, B

-- Student 2 - X A
INSERT INTO Students (Id, Name, Gender, FathersName, MothersName, DOB, Aadhaar, APAR, PEN, Contact, Address, Status, Caste, Religion, Height, Weight, BloodGroup)
VALUES 
('3f4c9a55-1d4e-4b90-b019-4f177654a1cb','Aarav Mehta', 'Male', 'Ramesh Mehta', 'Sunita Mehta', '2010-03-21', '111122223333', '111122223333', '10100000001', '9998887771', '5 MG Road, Delhi', 'Admitted', 'OBC', 'Hindu', 142, 40.0, 'A+');

INSERT INTO Admissions (StudentId, AcademicYearId, ClassId, SectionId, RollNo, AdmissionType)
VALUES (
    (SELECT Id FROM Students WHERE PEN = '10100000001'),
    (SELECT Id FROM AcademicYears WHERE IsActive = 1),
    (SELECT Id FROM Classes WHERE ClassName = 'X'),
    (SELECT Id FROM Sections WHERE SectionName = 'A'),
    1,
    'New'
);

-- Student 2 - X A
INSERT INTO Students (Id,Name, Gender, FathersName, MothersName, DOB, Aadhaar, APAR, PEN, Contact, Address, Status, Caste, Religion, Height, Weight, BloodGroup)
VALUES 
('7c85a85e-95a4-46d0-b94a-1c7b6a616c15', 'Aryan Singh', 'Male', 'Ravi Singh', 'Meera Singh', '2010-03-15', '222233334444', '222233334444', '10100000003', '9998877665', '21 Rose Park, Delhi', 'Admitted', 'OBC', 'Hindu', 142, 39.0, 'A+');

INSERT INTO Admissions (StudentId, AcademicYearId, ClassId, SectionId, RollNo, AdmissionType)
VALUES (
    (SELECT Id FROM Students WHERE PEN = '10100000003'),
    (SELECT Id FROM AcademicYears WHERE IsActive = 1),
    (SELECT Id FROM Classes WHERE ClassName = 'X'),
    (SELECT Id FROM Sections WHERE SectionName = 'A'),
    2,
    'New'
);

-- Student 3 - X A
INSERT INTO Students (Id, Name, Gender, FathersName, MothersName, DOB, Aadhaar, APAR, PEN, Contact, Address, Status, Caste, Religion, Height, Weight, BloodGroup)
VALUES 
('05b476e6-baad-4c8a-86ed-b00d5b9fa7f4', 'Sneha Nair', 'Female', 'Rajeev Nair', 'Latha Nair', '2010-07-20', '333344445555', '333344445555', '10100000004', '9998866554', '11 Green Avenue, Delhi', 'Admitted', 'General', 'Hindu', 139, 37.2, 'B+');

INSERT INTO Admissions (StudentId, AcademicYearId, ClassId, SectionId, RollNo, AdmissionType)
VALUES (
    (SELECT Id FROM Students WHERE PEN = '10100000004'),
    (SELECT Id FROM AcademicYears WHERE IsActive = 1),
    (SELECT Id FROM Classes WHERE ClassName = 'X'),
    (SELECT Id FROM Sections WHERE SectionName = 'A'),
    3,
    'New'
);

-- Student 4 - X A
INSERT INTO Students (Id, Name, Gender, FathersName, MothersName, DOB, Aadhaar, APAR, PEN, Contact, Address, Status, Caste, Religion, Height, Weight, BloodGroup)
VALUES 
('f65792f7-30a3-48a6-8fd3-828e8f5ff4a2', 'Rohit Das', 'Male', 'Anil Das', 'Sunita Das', '2010-01-25', '444455556666', '444455556666', '10100000005', '9998855443', '5 Mango Street, Delhi', 'Admitted', 'SC/ST', 'Hindu', 143, 38.0, 'O+');

INSERT INTO Admissions (StudentId, AcademicYearId, ClassId, SectionId, RollNo, AdmissionType)
VALUES (
    (SELECT Id FROM Students WHERE PEN = '10100000005'),
    (SELECT Id FROM AcademicYears WHERE IsActive = 1),
    (SELECT Id FROM Classes WHERE ClassName = 'X'),
    (SELECT Id FROM Sections WHERE SectionName = 'A'),
    4,
    'New'
);

-- Section B
-- Student 1 - X B
INSERT INTO Students (Id, Name, Gender, FathersName, MothersName, DOB, Aadhaar, APAR, PEN, Contact, Address, Status, Caste, Religion, Height, Weight, BloodGroup)
VALUES 
('68fa9a5b-5d82-4a0d-bbbc-d3a7d1745dd7', 'Ishita Verma', 'Female', 'Vikas Verma', 'Neha Verma', '2010-06-10', '111122224444', '111122224444', '10100000002', '9998887772', '9 Lotus Lane, Delhi', 'Admitted', 'General', 'Hindu', 140, 38.5, 'O+');

INSERT INTO Admissions (StudentId, AcademicYearId, ClassId, SectionId, RollNo, AdmissionType)
VALUES (
    (SELECT Id FROM Students WHERE PEN = '10100000002'),
    (SELECT Id FROM AcademicYears WHERE IsActive = 1),
    (SELECT Id FROM Classes WHERE ClassName = 'X'),
    (SELECT Id FROM Sections WHERE SectionName = 'B'),
    1,
    'New'
);

INSERT INTO Students (Id, Name, Gender, FathersName, MothersName, DOB, Aadhaar, APAR, PEN, Contact, Address, Status, Caste, Religion, Height, Weight, BloodGroup)
VALUES 
('4e166f67-04c7-4e09-8c52-b8a5f733bf0f', 'Kavya Sharma', 'Female', 'Amit Sharma', 'Pooja Sharma', '2010-08-05', '555566667777', '555566667777', '10100000006', '9998844332', '17 Palm View, Delhi', 'Admitted', 'General', 'Hindu', 141, 36.8, 'A-');

-- Student 2 - X B
INSERT INTO Admissions (StudentId, AcademicYearId, ClassId, SectionId, RollNo, AdmissionType)
VALUES (
    (SELECT Id FROM Students WHERE PEN = '10100000006'),
    (SELECT Id FROM AcademicYears WHERE IsActive = 1),
    (SELECT Id FROM Classes WHERE ClassName = 'X'),
    (SELECT Id FROM Sections WHERE SectionName = 'B'),
    2,
    'New'
);

-- Student 3 - X B
INSERT INTO Students (Id, Name, Gender, FathersName, MothersName, DOB, Aadhaar, APAR, PEN, Contact, Address, Status, Caste, Religion, Height, Weight, BloodGroup)
VALUES 
('0e49b063-9090-466f-bb13-bb45860b66e7', 'Mohammed Arif', 'Male', 'Salman Arif', 'Nasreen Arif', '2010-12-11', '666677778888', '666677778888', '10100000007', '9998833221', '3 Crescent Road, Delhi', 'Admitted', 'OBC', 'Muslim', 140, 37.5, 'B+');

INSERT INTO Admissions (StudentId, AcademicYearId, ClassId, SectionId, RollNo, AdmissionType)
VALUES (
    (SELECT Id FROM Students WHERE PEN = '10100000007'),
    (SELECT Id FROM AcademicYears WHERE IsActive = 1),
    (SELECT Id FROM Classes WHERE ClassName = 'X'),
    (SELECT Id FROM Sections WHERE SectionName = 'B'),
    3,
    'New'
);

-- Student 4 - X B
INSERT INTO Students (Id, Name, Gender, FathersName, MothersName, DOB, Aadhaar, APAR, PEN, Contact, Address, Status, Caste, Religion, Height, Weight, BloodGroup)
VALUES 
('9545ab7f-4293-41fd-bcc6-e2f73b8c3098', 'Priya Das', 'Female', 'Subhash Das', 'Anita Das', '2010-09-30', '777788889999', '777788889999', '10100000008', '9998822110', '8 Lily Road, Delhi', 'Admitted', 'SC/ST', 'Hindu', 138, 36.2, 'O+');

INSERT INTO Admissions (StudentId, AcademicYearId, ClassId, SectionId, RollNo, AdmissionType)
VALUES (
    (SELECT Id FROM Students WHERE PEN = '10100000008'),
    (SELECT Id FROM AcademicYears WHERE IsActive = 1),
    (SELECT Id FROM Classes WHERE ClassName = 'X'),
    (SELECT Id FROM Sections WHERE SectionName = 'B'),
    4,
    'New'
);
