-- 생성된 스킬 저장 테이블
CREATE TABLE IF NOT EXISTS skills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  topic TEXT,
  template_name TEXT,
  skill_content TEXT NOT NULL,
  template_analysis TEXT,
  matched_skills TEXT,
  tags TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 검색용 인덱스
CREATE INDEX IF NOT EXISTS idx_skills_topic ON skills(topic);
CREATE INDEX IF NOT EXISTS idx_skills_title ON skills(title);
CREATE INDEX IF NOT EXISTS idx_skills_created_at ON skills(created_at DESC);
