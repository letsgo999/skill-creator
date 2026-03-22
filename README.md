# AI 강의안 스킬 생성기

PDF/PPTX 강의 템플릿을 AI로 분석하여 동일한 구조와 스타일의 SKILL.md 문서를 자동 생성하는 웹 앱.

## URLs
- **Production**: https://skill-creator.pages.dev
- **GitHub**: https://github.com/letsgo999/skill-creator

## 주요 기능

### Step 0: AI API 키 입력
- Claude (Anthropic), OpenAI, Gemini 3종 지원
- 앱 실행 시 매번 API 키 직접 입력 (보안)

### Step 1: 템플릿 PDF 업로드 & AI 구조 분석
- PDF/PPTX 파일 드래그&드롭 업로드 (최대 10MB)
- AI가 슬라이드 구조, 흐름 패턴, 스타일, 핵심 키워드 자동 추출

### Step 2: 참조 스킬 선택
- **내장 스킬 3개** (Anthropic 공식 스킬 기반, 한국어 강의안 최적화):
  1. 강의안 슬라이드 생성 스킬 (pptx 스킬 기반)
  2. 강의안 테마 팩토리 (theme-factory 스킬 기반)
  3. SKILL.md 작성 전문가 (skill-creator 스킬 기반)
- **과거 내 스킬 자동 검색**: 키워드 기반 유사도 검색 (D1 DB)

### Step 3: SKILL.md 생성
- 템플릿 분석 + 참조 스킬 패턴 + 사용자 추가 요구사항 종합
- 마크다운 미리보기 / 원본 보기 전환
- 복사, 다운로드, DB 저장

### 관리자 모드 (/admin)
- 저장된 스킬 검색, 조회, 다운로드, 삭제
- 페이지네이션 지원

## 아키텍처

### 변경 이력 (v2 리팩토링)
| 항목 | v1 (이전) | v2 (현재) |
|---|---|---|
| 스킬 참조 | SkillsMP 마켓플레이스 API 자동 검색 | 내장 스킬 3개 + 과거 스킬 DB 검색 |
| API 키 | AI키 + SkillsMP키 2개 필요 | AI키 1개만 필요 |
| 외부 의존성 | SkillsMP API 호출 필수 | 외부 의존성 없음 (AI API만) |
| 비용 | AI + SkillsMP 양쪽 비용 | AI 비용만 |
| 스킬 품질 | 영문 범용 스킬 참조 | 한국어 강의안 특화 스킬 참조 |

### 기술 스택
- **Backend**: Hono (Cloudflare Workers)
- **Frontend**: Vanilla JS + Tailwind CSS (CDN)
- **Database**: Cloudflare D1 (SQLite)
- **AI**: Claude Sonnet 4 / GPT-4o / Gemini 2.5 Flash
- **Deployment**: Cloudflare Pages

### API 엔드포인트
| Method | Path | 설명 |
|---|---|---|
| POST | /api/verify-key | AI API 키 검증 |
| POST | /api/analyze-pdf | PDF 업로드 & AI 구조 분석 |
| GET | /api/built-in-skills | 내장 스킬 목록 |
| GET | /api/built-in-skills/:id | 내장 스킬 상세 |
| POST | /api/skills/search-similar | 과거 스킬 유사도 검색 |
| POST | /api/generate-skill | SKILL.md 생성 |
| POST | /api/skills/save | 스킬 DB 저장 |
| GET | /api/skills | 저장 스킬 목록 (관리자) |
| GET | /api/skills/:id | 스킬 상세 조회 |
| DELETE | /api/skills/:id | 스킬 삭제 |

### 데이터 모델
```sql
CREATE TABLE skills (
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
```

## 사용 방법
1. https://skill-creator.pages.dev 접속
2. AI 프로바이더 선택 후 API 키 입력 → 검증
3. 강의안 PDF 업로드 → AI 구조 분석
4. 내장 참조 스킬 선택 (기본 전체 선택) + 과거 스킬 자동 검색
5. 추가 요구사항 입력 (선택) → SKILL.md 생성
6. 미리보기 확인 후 복사/다운로드/DB 저장

## 배포 정보
- **Platform**: Cloudflare Pages
- **D1 Database**: skill-generator-db (7721feff-7207-4a43-a21d-cca94c51cc3c)
- **Status**: Active
- **Last Updated**: 2026-03-22
