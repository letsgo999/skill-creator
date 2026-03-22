# AI 강의안 스킬 생성기

## 프로젝트 개요
- **프로젝트명**: AI 기반 강의안 SKILL.md 자동 생성기
- **목적**: PDF/PPTX 강의안 템플릿을 AI로 분석하고, SkillsMP 마켓플레이스에서 유사 스킬을 매칭하여, 맞춤형 SKILL.md 문서를 자동 생성
- **대상 사용자**: 교육 콘텐츠 제작자, 강사, AI 에이전트 활용자
- **기술 스택**: Hono + TypeScript + Cloudflare Pages + D1 + TailwindCSS

## 완성된 기능 (MVP)
1. **API 키 검증 시스템** - OpenAI(기본) / Gemini(대체) 이중 지원, 실시간 연결 확인
2. **PDF 구조 분석** - AI 멀티모달 분석 (GPT-4o / Gemini 2.5 Flash)
3. **SkillsMP 유사 스킬 검색** - AI 시맨틱 검색 + 키워드 검색 폴백
4. **SKILL.md 자동 생성** - 템플릿 구조 + 매칭 스킬 + 사용자 초안 결합
5. **결과 관리** - 미리보기 / 마크다운 원본 / 복사 / 다운로드 / DB 저장
6. **관리자 모드** - 저장된 스킬 검색, 조회, 다운로드, 삭제

## URL 구조
| 경로 | 설명 |
|------|------|
| `/` | 메인 화면 - 스킬 생성 워크플로우 |
| `/admin` | 관리자 - 저장된 스킬 관리 |

## API 엔드포인트
| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/verify-key` | AI API 키 검증 (OpenAI/Gemini) |
| POST | `/api/analyze-pdf` | PDF 업로드 & AI 구조 분석 |
| POST | `/api/search-skills` | SkillsMP 유사 스킬 검색 |
| POST | `/api/generate-skill` | SKILL.md 생성 |
| POST | `/api/skills/save` | 스킬 DB 저장 |
| GET | `/api/skills` | 저장된 스킬 목록 (검색/페이징) |
| GET | `/api/skills/:id` | 스킬 상세 조회 |
| DELETE | `/api/skills/:id` | 스킬 삭제 |

## 사용 방법
1. **Step 0**: OpenAI API 키와 SkillsMP API 키를 입력하고 검증
2. **Step 1**: 분석할 PDF 강의안을 업로드하고 "AI 구조 분석 시작" 클릭
3. **Step 2**: 추출된 키워드로 SkillsMP에서 유사 스킬 검색
4. **Step 3**: 필요시 초안 텍스트 추가 후 "SKILL.md 생성하기" 클릭
5. 결과를 미리보기, 복사, 다운로드 또는 DB에 저장

## 데이터 아키텍처
- **DB**: Cloudflare D1 (SQLite)
- **테이블**: `skills` - 생성된 SKILL.md와 메타데이터 저장
- **저장 데이터**: 제목, 주제, 템플릿명, 스킬 내용, 분석 결과, 매칭 스킬, 태그

## 배포
- **플랫폼**: Cloudflare Pages
- **상태**: 개발 환경 작동 중
- **마지막 업데이트**: 2026-03-22
