-- schema.sql – Database schema for Project Team Matcher
-- Run this script after creating the MySQL database `teammatcher`

-- ---------------------------------------------------
-- Table: students
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  google_id VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  student_id VARCHAR(50) NULL,
  phone VARCHAR(20) NULL,
  github VARCHAR(255) NULL,
  linkedin VARCHAR(255) NULL,
  resume_url VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------
-- Table: skills (master list of possible skills)
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS skills (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- ---------------------------------------------------
-- Table: student_skills (many‑to‑many between students and skills)
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS student_skills (
  student_id INT NOT NULL,
  skill_id INT NOT NULL,
  PRIMARY KEY (student_id, skill_id),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------
-- Table: hackathons
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS hackathons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT NULL,
  start_date DATE NULL,
  end_date DATE NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------
-- Table: teams
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS teams (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  project_title VARCHAR(255) NOT NULL,
  project_description TEXT,
  leader_id INT NOT NULL,
  capacity INT NOT NULL CHECK (capacity > 0),
  status ENUM('open','closed','full') NOT NULL DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (leader_id) REFERENCES students(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ---------------------------------------------------
-- Table: team_hackathons (many‑to‑many between teams and hackathons)
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS team_hackathons (
  team_id INT NOT NULL,
  hackathon_id INT NOT NULL,
  PRIMARY KEY (team_id, hackathon_id),
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (hackathon_id) REFERENCES hackathons(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------
-- Table: team_skills (required skills for a team)
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS team_skills (
  team_id INT NOT NULL,
  skill_id INT NOT NULL,
  PRIMARY KEY (team_id, skill_id),
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------
-- Table: team_members (membership of students in teams)
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS team_members (
  team_id INT NOT NULL,
  student_id INT NOT NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (team_id, student_id),
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------
-- Table: team_requests (join requests from students to teams)
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS team_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  team_id INT NOT NULL,
  student_id INT NOT NULL,
  status ENUM('pending','accepted','rejected') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_request (team_id, student_id),
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Indexes for performance
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_teams_leader ON teams(leader_id);
CREATE INDEX idx_team_requests_status ON team_requests(status);

-- End of schema.sql
