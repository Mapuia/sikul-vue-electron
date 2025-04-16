-- User Roles
CREATE TABLE UserRoles (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    UserRoleName TEXT NOT NULL UNIQUE,
    RoleDescription TEXT    
);

-- Index for faster role-based queries
CREATE INDEX idx_UserRoles_UserRoleName ON UserRoles(UserRoleName);

-- Subjects Table
CREATE TABLE Subjects (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    SubjectName TEXT NOT NULL UNIQUE,
    SubjectCategory TEXT,
    isMandatory TEXT
);

CREATE INDEX idx_Subjects_Name ON Subjects(SubjectName);
CREATE INDEX idx_Subjects_Category ON Subjects(SubjectCategory);

-- Classes Table
CREATE TABLE Classes (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    ClassName TEXT NOT NULL UNIQUE
);

CREATE INDEX idx_Classes_Name ON Classes(ClassName);

-- Sections Table
CREATE TABLE Sections (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    SectionName TEXT NOT NULL UNIQUE
);

CREATE INDEX idx_Sections_Name ON Sections(SectionName);

-- Class & Subject Mapping
CREATE TABLE ClassSubjectMapping (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    ClassId INTEGER NOT NULL,
    SubjectId INTEGER NOT NULL,
    FOREIGN KEY (ClassId) REFERENCES Classes(Id),
    FOREIGN KEY (SubjectId) REFERENCES Subjects(Id)
);

CREATE INDEX idx_ClassSubjectMapping_Class ON ClassSubjectMapping(ClassId);
CREATE INDEX idx_ClassSubjectMapping_Subject ON ClassSubjectMapping(SubjectId);

-- Exam Name/ for Dropdown only
CREATE TABLE ExamName (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    ExamName TEXT NOT NULL UNIQUE,    
);

-- Exams
CREATE TABLE Exams (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    Year TEXT,
    ExamName TEXT NOT NULL UNIQUE,
    MajorMaxMark REAL,
    MinorMaxMark REAL,
    CoSholasticMaxMark REAL,
    StartDate DATE,
    EndDate DATE,
    UserId INTEGER,
    FOREIGN KEY (UserId) REFERENCES Users(Id)
);

CREATE INDEX idx_Exams_Name ON Exams(ExamsName);

-- Users Table
CREATE TABLE Users (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    Username TEXT NOT NULL UNIQUE,
    Password TEXT NOT NULL,
    Admin-Role INTEGER,
    Teacher-Role INTEGER,
    DataEntry-Role INTEGER
);

CREATE INDEX idx_Users_Username ON Users(Username);

-- Academic Years
CREATE TABLE AcademicYears (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    Year TEXT NOT NULL UNIQUE,
    StartDate DATE,
    EndDate DATE,
    IsActive INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_AcademicYears_Year ON AcademicYears(Year);
CREATE INDEX idx_AcademicYears_IsActive ON AcademicYears(IsActive);

-- Students Table
CREATE TABLE Students (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    Name TEXT NOT NULL,
    Gender TEXT,
    fathersName TEXT,
    mothersName TEXT,    
    DOB DATE,
    Aadhaar TEXT,
    APAR TEXT,
    APAR TEXT,
    Address TEXT,
    AdmissionDate DATE,
    Status TEXT DEFAULT "Admitted",
    UserId INTEGER,
    Creation_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    Modified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserId) REFERENCES Users(Id)
);

CREATE INDEX idx_Students_Name ON Students(Name);
CREATE INDEX idx_Students_Aadhaar ON Students(Aadhaar);
CREATE INDEX idx_Students_Status ON Students(Status);

-- Admission Table
CREATE TABLE Admission (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    StudentId INTEGER NOT NULL,
    AcademicYearId INTEGER NOT NULL,
    ClassId INTEGER NOT NULL,
    SectionId INTEGER NOT NULL,
    RollNo INTEGER NOT NULL,
    AdmissionType TEXT NOT NULL, 
    UserId INTEGER,   
    Creation_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    Modified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (StudentId) REFERENCES Students(Id),
    FOREIGN KEY (ClassId) REFERENCES Classes(Id),
    FOREIGN KEY (SectionId) REFERENCES Sections(Id),
    FOREIGN KEY (AcademicYearId) REFERENCES AcademicYears(Id),
    FOREIGN KEY (UserId) REFERENCES Users(Id)
);

CREATE INDEX idx_Admission_StudentId ON Admission(StudentId);
CREATE INDEX idx_Admission_ClassId ON Admission(ClassId);
CREATE INDEX idx_Admission_AcademicYearId ON Admission(AcademicYearId);

-- Marks Table
CREATE TABLE Marks (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    StudentId INTEGER NOT NULL,
    SubjectId INTEGER NOT NULL,
    ExamTypeId INTEGER NOT NULL,
    AcademicYearId INTEGER NOT NULL,
    MarksObtained REAL,
    UserId INTEGER,
    Creation_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    Modified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (StudentId) REFERENCES Students(Id),
    FOREIGN KEY (SubjectId) REFERENCES Subjects(Id),
    FOREIGN KEY (ExamTypeId) REFERENCES ExamTypes(Id),
    FOREIGN KEY (AcademicYearId) REFERENCES AcademicYears(Id),
    FOREIGN KEY (UserId) REFERENCES Users(Id)
);

CREATE INDEX idx_Marks_StudentId ON Marks(StudentId);
CREATE INDEX idx_Marks_SubjectId ON Marks(SubjectId);
CREATE INDEX idx_Marks_AcademicYearId ON Marks(AcademicYearId);
CREATE INDEX idx_Marks_ExamTypeId ON Marks(ExamTypeId);

-- Cumulative Marks
CREATE TABLE CumulativeMarks (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    StudentId INTEGER NOT NULL,
    SubjectId INTEGER NOT NULL,
    CummulativeType TEXT NOT NULL, 
    TotalMarks REAL DEFAULT 0,
    TotalMarksObtained REAL DEFAULT 0,
    AcademicYearId INTEGER NOT NULL,
    FOREIGN KEY (StudentId) REFERENCES Students(Id),
    FOREIGN KEY (SubjectId) REFERENCES Subjects(Id),
    FOREIGN KEY (AcademicYearId) REFERENCES AcademicYears(Id)
);

CREATE INDEX idx_CumulativeMarks_StudentId ON CumulativeMarks(StudentId);
CREATE INDEX idx_CumulativeMarks_AcademicYearId ON CumulativeMarks(AcademicYearId);

-- Results Table
CREATE TABLE Results (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    AcademicYearId INTEGER NOT NULL,
    StudentId INTEGER NOT NULL,
    ExamName TEXT NOT NULL,
    TotalMarks REAL NOT NULL,    
    Percentage REAL NOT NULL,
    Division TEXT NOT NULL,
    Rank INTEGER,
    ResultStatus TEXT NOT NULL,
    Published INTEGER DEFAULT 0,
    Creation_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    Modified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (StudentId) REFERENCES Students(Id),
    FOREIGN KEY (AcademicYearId) REFERENCES AcademicYears(Id)
);

CREATE INDEX idx_Results_StudentId ON Results(StudentId);
CREATE INDEX idx_Results_AcademicYearId ON Results(AcademicYearId);
CREATE INDEX idx_Results_ExamName ON Results(ExamName);
CREATE INDEX idx_Results_Percentage ON Results(Percentage);

-- Report Cards
CREATE TABLE ReportCards (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    StudentId INTEGER NOT NULL,
    AcademicYearId INTEGER NOT NULL,
    ReportCardData TEXT NOT NULL, 
    UserId INTEGER,
    Creation_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    Modified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (StudentId) REFERENCES Students(Id),
    FOREIGN KEY (AcademicYearId) REFERENCES AcademicYears(Id),
    FOREIGN KEY (UserId) REFERENCES Users(Id)
);

CREATE INDEX idx_ReportCards_StudentId ON ReportCards(StudentId);
CREATE INDEX idx_ReportCards_AcademicYearId ON ReportCards(AcademicYearId);
