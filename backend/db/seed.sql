-- seed.sql – Sample data for the Project Team Matcher
-- Run this after the schema has been created:
--   mysql -u root -p teammatcher < db/seed.sql

-- ---------------------------------------------------
-- 1. Students (minimal required fields)
-- ---------------------------------------------------
INSERT INTO students (google_id, full_name, email, student_id, phone)
VALUES
  ('google-1001', 'Alice Sharma', 'alice.sharma@example.com', '102024001', '9876543210'),
  ('google-1002', 'Bob Kumar', 'bob.kumar@example.com', '102024002', '9876543211'),
  ('google-1003', 'Carol Singh', 'carol.singh@example.com', '102024003', '9876543212');

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
  ('SQL');

-- ---------------------------------------------------
-- 3. Student‑Skills (many‑to‑many)
-- ---------------------------------------------------
INSERT INTO student_skills (student_id, skill_id)
SELECT s.id, sk.id
FROM (SELECT 'google-1001' AS g_id) AS src
JOIN students s ON s.google_id = src.g_id
JOIN skills sk ON sk.name IN ('JavaScript', 'HTML', 'CSS');

INSERT INTO student_skills (student_id, skill_id)
SELECT s.id, sk.id
FROM (SELECT 'google-1002' AS g_id) AS src
JOIN students s ON s.google_id = src.g_id
JOIN skills sk ON sk.name IN ('Python', 'Machine Learning', 'SQL');

INSERT INTO student_skills (student_id, skill_id)
SELECT s.id, sk.id
FROM (SELECT 'google-1003' AS g_id) AS src
JOIN students s ON s.google_id = src.g_id
JOIN skills sk ON sk.name IN ('C++', 'SQL');

-- ---------------------------------------------------
-- 4. Hackathons
-- ---------------------------------------------------
INSERT INTO hackathons (name, description, start_date, end_date) VALUES
  ('Hack4Good', 'Social impact hackathon', '2025-02-01', '2025-02-03'),
  ('AI Innovation Challenge', 'AI‑focused competition', '2025-04-10', '2025-04-12');

-- ---------------------------------------------------
-- 5. Teams (leader_id will reference students inserted above)
-- ---------------------------------------------------
INSERT INTO teams (name, project_title, project_description, leader_id, capacity, status)
SELECT 'Smart Campus', 'Campus IoT Platform', 'Build a sensor‑driven campus management system.', s.id, 5, 'open'
FROM students s WHERE s.google_id = 'google-1001';

INSERT INTO teams (name, project_title, project_description, leader_id, capacity, status)
SELECT 'AI Traffic', 'Intelligent Traffic Analyzer', 'Use ML to predict traffic congestion.', s.id, 4, 'open'
FROM students s WHERE s.google_id = 'google-1002';

-- ---------------------------------------------------
-- 6. Team‑Hackathons (link teams to hackathons)
-- ---------------------------------------------------
INSERT INTO team_hackathons (team_id, hackathon_id)
SELECT t.id, h.id
FROM teams t JOIN hackathons h ON h.name = 'Hack4Good' WHERE t.name = 'Smart Campus';

INSERT INTO team_hackathons (team_id, hackathon_id)
SELECT t.id, h.id
FROM teams t JOIN hackathons h ON h.name = 'AI Innovation Challenge' WHERE t.name = 'AI Traffic';

-- ---------------------------------------------------
-- 7. Team‑Skills (required skills for each team)
-- ---------------------------------------------------
INSERT INTO team_skills (team_id, skill_id)
SELECT t.id, sk.id
FROM teams t JOIN skills sk ON sk.name IN ('JavaScript', 'SQL') WHERE t.name = 'Smart Campus';

INSERT INTO team_skills (team_id, skill_id)
SELECT t.id, sk.id
FROM teams t JOIN skills sk ON sk.name IN ('Python', 'Machine Learning') WHERE t.name = 'AI Traffic';

-- ---------------------------------------------------
-- 8. Team‑Members (initial members – include the leader)
-- ---------------------------------------------------
INSERT INTO team_members (team_id, student_id)
SELECT t.id, s.id FROM teams t JOIN students s ON s.google_id = 'google-1001' WHERE t.name = 'Smart Campus';

INSERT INTO team_members (team_id, student_id)
SELECT t.id, s.id FROM teams t JOIN students s ON s.google_id = 'google-1002' WHERE t.name = 'AI Traffic';

-- ---------------------------------------------------
-- 9. Team‑Requests (example pending request)
-- ---------------------------------------------------
INSERT INTO team_requests (team_id, student_id, status)
SELECT t.id, s.id, 'pending'
FROM teams t JOIN students s ON s.google_id = 'google-1003' WHERE t.name = 'Smart Campus';

-- End of seed.sql
