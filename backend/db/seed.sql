-- seed.sql – Sample data for TeamForge
-- Run this after the schema has been created:
--   mysql -u root -p teammatcher < db/seed.sql

-- ---------------------------------------------------
-- 1. Students (TIET Team Members Only)
-- ---------------------------------------------------
INSERT INTO students (google_id, full_name, email, student_id, phone)
VALUES
  ('google-1001', 'Mohit Garg', 'mgarg_be24@thapar.edu', '1024031006', '9876543210'),
  ('google-1002', 'Paras Sharma', 'psharma_be24@thapar.edu', '1024030609', '9876543211'),
  ('google-1003', 'Manan Dhingra', 'mdhingra_be24@thapar.edu', '1024030222', '9876543212'),
  ('google-1004', 'Parv Panwar', 'ppanwar_be24@thapar.edu', '1024030226', '9876543213');

-- ---------------------------------------------------
-- 2. Skills (master list)
-- ---------------------------------------------------
INSERT INTO skills (name) VALUES
  ('JavaScript'),
  ('Python'),
  ('C++'),
  ('Machine Learning'),
  ('HTML'),
  ('CSS'),
  ('SQL'),
  ('React'),
  ('Node.js');

-- ---------------------------------------------------
-- 3. Student‑Skills (many‑to‑many)
-- ---------------------------------------------------
INSERT INTO student_skills (student_id, skill_id)
SELECT s.id, sk.id
FROM (SELECT 'google-1001' AS g_id) AS src
JOIN students s ON s.google_id = src.g_id
JOIN skills sk ON sk.name IN ('JavaScript', 'React', 'Node.js', 'C++');

INSERT INTO student_skills (student_id, skill_id)
SELECT s.id, sk.id
FROM (SELECT 'google-1002' AS g_id) AS src
JOIN students s ON s.google_id = src.g_id
JOIN skills sk ON sk.name IN ('Python', 'SQL', 'Node.js');

INSERT INTO student_skills (student_id, skill_id)
SELECT s.id, sk.id
FROM (SELECT 'google-1003' AS g_id) AS src
JOIN students s ON s.google_id = src.g_id
JOIN skills sk ON sk.name IN ('HTML', 'CSS', 'JavaScript', 'SQL');

INSERT INTO student_skills (student_id, skill_id)
SELECT s.id, sk.id
FROM (SELECT 'google-1004' AS g_id) AS src
JOIN students s ON s.google_id = src.g_id
JOIN skills sk ON sk.name IN ('Python', 'Machine Learning', 'React');

-- ---------------------------------------------------
-- 4. Hackathons
-- ---------------------------------------------------
INSERT INTO hackathons (name, description, start_date, end_date) VALUES
  ('Hack4Good', 'Social impact hackathon', '2025-02-01', '2025-02-03'),
  ('AI Innovation Challenge', 'AI‑focused competition', '2025-04-10', '2025-04-12');

-- ---------------------------------------------------
-- 5. Teams (leader_id references students above)
-- ---------------------------------------------------
INSERT INTO teams (name, project_title, project_description, leader_id, capacity, status)
SELECT 'Smart Campus', 'Campus IoT Platform', 'Build a sensor‑driven campus management system.', s.id, 4, 'open'
FROM students s WHERE s.google_id = 'google-1002';

INSERT INTO teams (name, project_title, project_description, leader_id, capacity, status)
SELECT 'AI Traffic', 'Intelligent Traffic Analyzer', 'Use ML to predict traffic congestion.', s.id, 4, 'open'
FROM students s WHERE s.google_id = 'google-1004';

INSERT INTO teams (name, project_title, project_description, leader_id, capacity, status)
SELECT 'EcoTrack', 'Sustainability Tracker', 'Track campus carbon and energy footprint.', s.id, 4, 'open'
FROM students s WHERE s.google_id = 'google-1001';

-- ---------------------------------------------------
-- 6. Team‑Hackathons
-- ---------------------------------------------------
INSERT INTO team_hackathons (team_id, hackathon_id)
SELECT t.id, h.id
FROM teams t JOIN hackathons h ON h.name = 'Hack4Good' WHERE t.name = 'Smart Campus';

INSERT INTO team_hackathons (team_id, hackathon_id)
SELECT t.id, h.id
FROM teams t JOIN hackathons h ON h.name = 'AI Innovation Challenge' WHERE t.name = 'AI Traffic';

-- ---------------------------------------------------
-- 7. Team‑Skills
-- ---------------------------------------------------
INSERT INTO team_skills (team_id, skill_id)
SELECT t.id, sk.id
FROM teams t JOIN skills sk ON sk.name IN ('JavaScript', 'SQL', 'React') WHERE t.name = 'Smart Campus';

INSERT INTO team_skills (team_id, skill_id)
SELECT t.id, sk.id
FROM teams t JOIN skills sk ON sk.name IN ('Python', 'Machine Learning') WHERE t.name = 'AI Traffic';

-- ---------------------------------------------------
-- 8. Team‑Members
-- ---------------------------------------------------
INSERT INTO team_members (team_id, student_id)
SELECT t.id, s.id FROM teams t JOIN students s ON s.google_id = 'google-1002' WHERE t.name = 'Smart Campus';

INSERT INTO team_members (team_id, student_id)
SELECT t.id, s.id FROM teams t JOIN students s ON s.google_id = 'google-1004' WHERE t.name = 'AI Traffic';

-- ---------------------------------------------------
-- 9. Team‑Requests
-- ---------------------------------------------------
INSERT INTO team_requests (team_id, student_id, status)
SELECT t.id, s.id, 'pending'
FROM teams t JOIN students s ON s.google_id = 'google-1001' WHERE t.name = 'Smart Campus';
