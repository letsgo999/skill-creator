import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('/api/*', cors())

// ============================================================
// 내장 스킬 데이터 (Anthropic 공식 스킬 기반 한국어 강의안 최적화)
// ============================================================
const BUILT_IN_SKILLS = [
  {
    id: 'lecture-slide-generator',
    name: '강의안 슬라이드 생성 스킬',
    source: 'Anthropic pptx 스킬 기반',
    description: 'PDF/PPTX 강의 템플릿을 분석하여 동일한 구조와 스타일의 새 강의안 슬라이드를 생성하는 스킬. 한국어 교육 콘텐츠에 최적화.',
    tags: ['강의안', '슬라이드', 'PPTX', '프레젠테이션', '교육'],
    content: `# 강의안 슬라이드 생성 스킬

## 개요
이 스킬은 기존 강의안 템플릿(PDF/PPTX)을 분석하여 동일한 구조, 흐름, 톤앤매너로 새로운 강의안 슬라이드를 생성합니다.

## 트리거 조건
- 사용자가 "강의안", "슬라이드", "프레젠테이션", "교육자료" 생성을 요청할 때
- 기존 템플릿 파일이 제공되었을 때
- "이 형식대로 새로 만들어줘" 류의 요청

## 핵심 규칙

### 1. 템플릿 구조 분석
- **도입부**: 제목 슬라이드, 목차, 학습 목표 (보통 전체의 10-15%)
- **본론**: 핵심 내용 전달, 사례/예시, 실습 (보통 70-80%)
- **결론**: 요약, Q&A, 참고자료 (보통 10-15%)

### 2. 슬라이드별 콘텐츠 밀도
| 슬라이드 유형 | 최대 항목 수 | 비고 |
|---|---|---|
| 타이틀 슬라이드 | 제목 1 + 부제 1 | 깔끔하게 |
| 목차 슬라이드 | 5-7개 항목 | 번호 매기기 |
| 콘텐츠 슬라이드 | 제목 1 + 불릿 4-6개 | 핵심만 |
| 이미지+텍스트 | 이미지 1 + 설명 3줄 | 시각 중심 |
| 비교 슬라이드 | 2-3개 열 비교 | 표 형식 |
| 요약 슬라이드 | 핵심 3-5개 | 한눈에 |

### 3. 한국어 교육 콘텐츠 특화 규칙
- 경어체 사용 (합니다/습니다체)
- 전문 용어는 첫 등장 시 영문 병기 (예: 인공지능(AI))
- 한 슬라이드 = 한 핵심 메시지 원칙
- 불릿 포인트는 명사형 종결 또는 간결한 문장형
- 실습/활용 예시를 반드시 포함

### 4. 디자인 가이드
- **색상**: 주제에 맞는 전용 색상 팔레트 선택
- **폰트**: 제목 24-36pt 볼드, 본문 16-20pt
- **여백**: 상하좌우 최소 0.5인치
- **시각 요소**: 매 슬라이드에 아이콘, 도표, 이미지 중 하나 이상

### 5. 작업 흐름
\`\`\`
Phase 1: 템플릿 분석 (구조, 흐름, 스타일 추출)
Phase 2: 콘텐츠 설계 (슬라이드 구성안 작성)
Phase 3: 슬라이드 생성 (디자인 시스템 적용)
Phase 4: 품질 검증 (접근성, 일관성, 가독성)
Phase 5: 최종 출력 (PPTX/HTML 생성)
\`\`\`

## 출력 형식
- 단일 PPTX 파일 또는 자체 완결형 HTML
- 발표자 노트 포함
- 접근성 준수 (WCAG 2.1 AA)`
  },
  {
    id: 'lecture-theme-factory',
    name: '강의안 테마 팩토리',
    source: 'Anthropic theme-factory 스킬 기반',
    description: '강의안에 적용할 수 있는 전문 테마(색상 팔레트 + 폰트 조합)를 제공하고 적용하는 스킬. 한국어 교육/기업 환경에 맞춤.',
    tags: ['테마', '디자인', '색상', '폰트', '스타일링'],
    content: `# 강의안 테마 팩토리

## 개요
강의안/프레젠테이션에 전문적인 시각 테마를 적용하는 도구입니다. 10개의 프리셋 테마 + 커스텀 테마 생성을 지원합니다.

## 트리거 조건
- 강의안의 디자인/스타일링이 필요할 때
- "테마 적용", "색상 변경", "디자인 꾸미기" 요청 시
- 새 강의안 생성 시 Phase 3에서 자동 참조

## 한국어 교육용 테마 프리셋

### 1. 전문 강의 (Professional Lecture)
| 요소 | 값 |
|---|---|
| Primary | \`#1E3A5F\` (네이비) |
| Secondary | \`#4A90D9\` (스카이블루) |
| Accent | \`#F5A623\` (골드) |
| Background | \`#F8F9FA\` (라이트그레이) |
| 제목 폰트 | 나눔스퀘어 Bold / Arial Black |
| 본문 폰트 | 나눔고딕 / Calibri |

### 2. 테크 이노베이션 (Tech Innovation)
| 요소 | 값 |
|---|---|
| Primary | \`#6C5CE7\` (퍼플) |
| Secondary | \`#00CEC9\` (시안) |
| Accent | \`#FD79A8\` (핑크) |
| Background | \`#2D3436\` (다크) |
| 제목 폰트 | Pretendard Bold / Arial |
| 본문 폰트 | Pretendard / Calibri |

### 3. AI/디지털 (AI & Digital)
| 요소 | 값 |
|---|---|
| Primary | \`#667EEA\` (인디고) |
| Secondary | \`#764BA2\` (바이올렛) |
| Accent | \`#F093FB\` (라벤더) |
| Background | \`#FFFFFF\` |
| 제목 폰트 | 나눔스퀘어 ExtraBold |
| 본문 폰트 | 나눔고딕 Light |

### 4. 비즈니스 클래식 (Business Classic)
| 요소 | 값 |
|---|---|
| Primary | \`#2C3E50\` (미드나이트) |
| Secondary | \`#E74C3C\` (레드) |
| Accent | \`#F39C12\` (오렌지) |
| Background | \`#ECF0F1\` |
| 제목 폰트 | Georgia / 나눔명조 Bold |
| 본문 폰트 | Calibri / 나눔고딕 |

### 5. 교육 프렌들리 (Education Friendly)
| 요소 | 값 |
|---|---|
| Primary | \`#27AE60\` (그린) |
| Secondary | \`#3498DB\` (블루) |
| Accent | \`#F1C40F\` (옐로) |
| Background | \`#FEFEFE\` |
| 제목 폰트 | 나눔스퀘어라운드 Bold |
| 본문 폰트 | 나눔고딕 |

### 6-10: 추가 테마
- **미니멀 모던**: 무채색 + 포인트 1색
- **웜 테라코타**: 따뜻한 어스톤
- **오션 블루**: 해양 그라디언트
- **포레스트 캄**: 자연 초록 계열
- **미드나이트 갤럭시**: 다크 우주 테마

## 커스텀 테마 생성
사용자 입력(주제, 분위기, 대상)에 기반하여 새 테마를 생성합니다.
1. 주제 키워드에서 색상 도출
2. 대상 청중에 맞는 폰트 선택
3. 3개 시안 생성 → 선택 → 적용

## 적용 규칙
- 주색(Primary)이 전체 시각 비중의 60-70%
- 보조색(Secondary) 20-30%
- 강조색(Accent) 5-10%
- 타이틀 + 결론 슬라이드는 다크 배경, 콘텐츠는 라이트 배경
- WCAG 2.1 AA 대비율 4.5:1 이상 준수`
  },
  {
    id: 'skill-md-creator',
    name: 'SKILL.md 작성 전문가',
    source: 'Anthropic skill-creator 스킬 기반',
    description: '표준 SKILL.md 포맷에 맞는 고품질 스킬 문서를 작성하는 전문 스킬. 트리거 조건, 작업 흐름, 출력 형식을 체계적으로 구성.',
    tags: ['SKILL.md', '스킬 작성', '문서 생성', 'AI 에이전트'],
    content: `# SKILL.md 작성 전문가

## 개요
AI 에이전트(Claude, ChatGPT, Codex 등)가 즉시 사용할 수 있는 표준 SKILL.md 문서를 작성합니다.

## 트리거 조건
- "스킬 만들어줘", "SKILL.md 생성" 요청 시
- 기존 워크플로우를 스킬로 변환하고 싶을 때
- 템플릿 분석 후 재사용 가능한 스킬 문서화가 필요할 때

## SKILL.md 표준 구조

\`\`\`yaml
---
name: 스킬-이름
description: "트리거 조건과 용도를 구체적으로 설명. 
  이 스킬이 어떤 상황에서 활성화되는지, 어떤 키워드에 반응하는지 명시."
version: 1.0.0
tags: [태그1, 태그2]
---
\`\`\`

### 필수 섹션

1. **개요 (Overview)**
   - 스킬이 하는 일 한 문장 요약
   - 핵심 가치 제안

2. **트리거 조건 (When to Use)**
   - 구체적인 사용자 발화 패턴
   - 파일 유형이나 컨텍스트 조건
   - "~할 때 이 스킬을 사용하세요" 형태로 명시적 기술

3. **핵심 규칙 (Core Rules)**
   - 반드시 지켜야 할 원칙들
   - 제약 조건과 금지 사항
   - 이유(WHY)를 함께 설명

4. **작업 흐름 (Workflow/Phases)**
   - 단계별 실행 순서
   - 각 단계의 입력/출력
   - 예상 소요 시간

5. **출력 형식 (Output Format)**
   - 구체적인 결과물 형태
   - 파일 형식, 구조, 명명 규칙

### 선택 섹션
- 예시 (Examples)
- 품질 검증 (QA)
- 의존성 (Dependencies)
- 참고 자료 (References)

## 작성 원칙

### 1. 명령형 작성
"~해야 합니다" 대신 "~하세요" 형태의 직접적 지시
\`\`\`
❌ "제목은 36pt 이상이어야 합니다"
✅ "제목은 36pt 이상으로 설정하세요"
\`\`\`

### 2. WHY 설명
무조건적인 MUST/NEVER 대신 이유를 설명
\`\`\`
❌ "절대 한 슬라이드에 7개 이상 불릿을 넣지 마세요"
✅ "한 슬라이드의 불릿은 4-6개로 제한하세요. 7개를 넘으면 
   청중이 핵심 메시지를 파악하기 어렵습니다."
\`\`\`

### 3. Progressive Disclosure
- SKILL.md 본문은 500줄 이내
- 상세 참고 자료는 별도 파일로 분리
- 큰 참고 파일(300줄+)에는 목차 포함

### 4. 구체적 트리거 설명
스킬이 활성화되어야 하는 상황을 최대한 구체적으로
\`\`\`
❌ "프레젠테이션 관련 작업 시 사용"
✅ "사용자가 '강의안', '슬라이드', '발표자료'를 언급하거나,
   .pptx/.pdf 파일을 제공하며 '이 형식으로 만들어줘'라고 
   요청할 때 사용. 단순 파일 읽기가 아닌 새 콘텐츠 생성이 
   필요한 경우에 활성화."
\`\`\`

## 품질 체크리스트
- [ ] 트리거 조건이 구체적인가?
- [ ] 작업 흐름이 단계별로 명확한가?
- [ ] 출력 형식이 정확히 정의되었는가?
- [ ] WHY가 충분히 설명되었는가?
- [ ] 500줄 이내인가?
- [ ] 다른 스킬과 트리거 충돌이 없는가?`
  }
]

// ============================================================
// API 라우트들
// ============================================================

// 1) API 키 검증 (Claude / OpenAI / Gemini)
app.post('/api/verify-key', async (c) => {
  const { apiKey, provider } = await c.req.json<{ apiKey: string; provider: 'claude' | 'openai' | 'gemini' }>()

  if (!apiKey || !provider) {
    return c.json({ valid: false, error: 'API 키와 프로바이더를 입력해주세요.' }, 400)
  }

  try {
    if (provider === 'claude') {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'ping' }]
        })
      })
      if (res.ok || res.status === 200) {
        return c.json({ valid: true, provider: 'claude', message: 'Claude API 키가 정상입니다.' })
      } else {
        const err = await res.json().catch(() => ({})) as any
        return c.json({ valid: false, error: err?.error?.message || `Claude 인증 실패 (${res.status})` })
      }
    } else if (provider === 'openai') {
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      })
      if (res.ok) {
        return c.json({ valid: true, provider: 'openai', message: 'OpenAI API 키가 정상입니다.' })
      } else {
        const err = await res.json().catch(() => ({})) as any
        return c.json({ valid: false, error: err?.error?.message || `OpenAI 인증 실패 (${res.status})` })
      }
    } else {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
      if (res.ok) {
        return c.json({ valid: true, provider: 'gemini', message: 'Gemini API 키가 정상입니다.' })
      } else {
        return c.json({ valid: false, error: `Gemini 인증 실패 (${res.status})` })
      }
    }
  } catch (e: any) {
    return c.json({ valid: false, error: e.message || '키 검증 중 오류 발생' }, 500)
  }
})

// 2) PDF 업로드 & AI 구조 분석
app.post('/api/analyze-pdf', async (c) => {
  const formData = await c.req.formData()
  const file = formData.get('file') as File | null
  const apiKey = formData.get('apiKey') as string
  const provider = formData.get('provider') as string

  if (!file || !apiKey) {
    return c.json({ error: 'PDF 파일과 API 키가 필요합니다.' }, 400)
  }

  const arrayBuffer = await file.arrayBuffer()
  const uint8Array = new Uint8Array(arrayBuffer)
  let binaryStr = ''
  const chunkSize = 8192
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length))
    binaryStr += String.fromCharCode(...chunk)
  }
  const base64 = btoa(binaryStr)

  const analysisPrompt = `당신은 교육 콘텐츠 분석 전문가입니다. 첨부된 PDF 강의안을 정밀하게 분석하여 다음 정보를 JSON 형식으로 추출해주세요:

{
  "title": "강의 제목",
  "topic": "주요 주제/분야",
  "totalSlides": 슬라이드 수,
  "structure": {
    "introduction": ["도입부 슬라이드 요약들"],
    "mainContent": ["본론 슬라이드 요약들"],
    "conclusion": ["결론 슬라이드 요약들"]
  },
  "keyTopics": ["핵심 키워드1", "핵심 키워드2"],
  "flowPattern": "논리 전개 패턴 설명",
  "styleAnalysis": {
    "toneAndManner": "어조와 매너",
    "contentDensity": "콘텐츠 밀도",
    "audienceLevel": "대상 청중 수준"
  },
  "searchKeywords": ["검색용 키워드1", "키워드2", "키워드3"]
}

반드시 유효한 JSON만 출력하세요. 다른 텍스트는 포함하지 마세요.`

  try {
    let result: string

    if (provider === 'claude') {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'document',
                source: { type: 'base64', media_type: 'application/pdf', data: base64 }
              },
              { type: 'text', text: analysisPrompt }
            ]
          }]
        })
      })

      if (!res.ok) {
        const errBody = await res.text()
        return c.json({ error: `Claude API 오류 (${res.status}): ${errBody}` }, 500)
      }
      const data = await res.json() as any
      result = data.content?.[0]?.text || ''
    } else if (provider === 'openai') {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: analysisPrompt },
              {
                type: 'file',
                file: {
                  filename: file.name || 'document.pdf',
                  file_data: `data:${file.type || 'application/pdf'};base64,${base64}`
                }
              }
            ]
          }],
          max_tokens: 4000,
          temperature: 0.2
        })
      })

      if (!res.ok) {
        const errBody = await res.text()
        return c.json({ error: `OpenAI API 오류 (${res.status}): ${errBody}` }, 500)
      }
      const data = await res.json() as any
      result = data.choices?.[0]?.message?.content || ''
    } else {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: analysisPrompt },
              { inline_data: { mime_type: 'application/pdf', data: base64 } }
            ]
          }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 4000 }
        })
      })

      if (!res.ok) {
        const errBody = await res.text()
        return c.json({ error: `Gemini API 오류 (${res.status}): ${errBody}` }, 500)
      }
      const data = await res.json() as any
      result = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    }

    // JSON 파싱
    let cleanResult = result.trim()
    cleanResult = cleanResult.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()

    const jsonMatch = cleanResult.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        const analysis = JSON.parse(jsonMatch[0])
        return c.json({ success: true, analysis })
      } catch (parseErr: any) {
        let fixedJson = jsonMatch[0]
          .replace(/,\s*([}\]])/g, '$1')
          .replace(/\/\/.*$/gm, '')
          .replace(/\.\.\.\s*/g, '')
          .replace(/([{,]\s*)(\w+)\s*:/g, '$1"$2":')
        try {
          const analysis = JSON.parse(fixedJson)
          return c.json({ success: true, analysis })
        } catch {
          return c.json({ success: true, analysis: { raw: result, parseError: parseErr.message } })
        }
      }
    } else {
      return c.json({ success: true, analysis: { raw: result } })
    }
  } catch (e: any) {
    return c.json({ error: `분석 중 오류: ${e.message}` }, 500)
  }
})

// 3) 내장 스킬 목록 조회
app.get('/api/built-in-skills', (c) => {
  return c.json({
    success: true,
    skills: BUILT_IN_SKILLS.map(s => ({
      id: s.id,
      name: s.name,
      source: s.source,
      description: s.description,
      tags: s.tags
    }))
  })
})

// 4) 내장 스킬 상세 조회
app.get('/api/built-in-skills/:id', (c) => {
  const id = c.req.param('id')
  const skill = BUILT_IN_SKILLS.find(s => s.id === id)
  if (!skill) return c.json({ error: '내장 스킬을 찾을 수 없습니다.' }, 404)
  return c.json({ success: true, skill })
})

// 5) 과거 내 스킬 유사도 검색
app.post('/api/skills/search-similar', async (c) => {
  const { keywords } = await c.req.json<{ keywords: string[] }>()

  if (!keywords?.length) {
    return c.json({ error: '검색 키워드가 필요합니다.' }, 400)
  }

  try {
    // 키워드 기반 LIKE 검색 (D1은 FTS 미지원이므로 LIKE 조합)
    const conditions = keywords.map(() => '(title LIKE ? OR topic LIKE ? OR tags LIKE ? OR skill_content LIKE ?)').join(' OR ')
    const bindings: string[] = []
    keywords.forEach(k => {
      const like = `%${k}%`
      bindings.push(like, like, like, like)
    })

    const results = await c.env.DB.prepare(
      `SELECT id, title, topic, template_name, tags, created_at,
              substr(skill_content, 1, 200) as preview
       FROM skills
       WHERE ${conditions}
       ORDER BY created_at DESC
       LIMIT 10`
    ).bind(...bindings).all()

    return c.json({ success: true, skills: results.results })
  } catch (e: any) {
    return c.json({ error: `검색 오류: ${e.message}` }, 500)
  }
})

// 6) SKILL.md 생성 (내장 스킬 패턴 + 과거 스킬 참조)
app.post('/api/generate-skill', async (c) => {
  const { templateAnalysis, selectedBuiltInSkills, pastSkills, draftText, apiKey, provider } = await c.req.json<{
    templateAnalysis: any
    selectedBuiltInSkills: string[]
    pastSkills: any[]
    draftText: string
    apiKey: string
    provider: string
  }>()

  if (!templateAnalysis || !apiKey) {
    return c.json({ error: '템플릿 분석 결과와 API 키가 필요합니다.' }, 400)
  }

  // 선택된 내장 스킬 콘텐츠 수집
  const builtInRef = (selectedBuiltInSkills || [])
    .map(id => BUILT_IN_SKILLS.find(s => s.id === id))
    .filter(Boolean)
    .map((s, i) => `### 내장 참조 스킬 ${i + 1}: ${s!.name}\n${s!.content}`)
    .join('\n\n')

  // 과거 스킬 참조
  const pastRef = (pastSkills || [])
    .map((s: any, i: number) => `### 과거 생성 스킬 ${i + 1}: ${s.title}\n${s.preview || s.skill_content?.substring(0, 300) || ''}`)
    .join('\n\n')

  const draftSection = draftText ? `\n\n## 사용자 추가 요구사항:\n${draftText}` : ''

  const generatePrompt = `당신은 AI 에이전트용 SKILL.md 문서를 작성하는 전문가입니다.

아래 정보를 종합하여, Claude Code가 즉시 사용할 수 있는 고품질 SKILL.md 파일을 생성해주세요.

## 분석된 템플릿 구조:
${JSON.stringify(templateAnalysis, null, 2)}

${builtInRef ? `## 참조할 내장 스킬 패턴:\n${builtInRef}` : ''}

${pastRef ? `## 참조할 과거 생성 스킬:\n${pastRef}` : ''}

${draftSection}

## [절대규칙] YAML Frontmatter 형식 — 아래 형식을 한 글자도 빠짐없이 지켜라

출력의 첫 번째 줄은 반드시 --- (대시 세 개)이다.
그 다음 줄에 name: 값, 그 다음 줄에 description: "값" 순서로 적는다.
마지막에 다시 --- 을 적어 frontmatter를 닫는다.

name 규칙 (위반 시 Claude가 거부함):
- 영문 소문자, 숫자, 하이픈(-) 만 허용. 한글/공백/언더스코어/대문자 절대 금지
- 최대 64자 이내
- 예시: ai-lecture-slide-generator, gov-training-presenter

description 규칙:
- 반드시 쌍따옴표로 감싼 한 줄 문자열. 줄바꿈 금지
- 1024자 이내
- XML 태그(<, >) 금지
- 스킬이 무엇을 하는지 + 어떤 상황에서 활성화되는지를 설명

실제 출력 예시 (첫 5줄):
---
name: ai-lecture-slide-generator
description: "PDF/PPTX 강의 템플릿을 분석하여 동일한 구조의 새 강의안 슬라이드를 생성하는 스킬. 사용자가 강의안, 슬라이드, 프레젠테이션 생성을 요청하거나 PDF/PPTX 파일을 제공할 때 활성화."
---

version, tags 등 다른 필드는 넣지 마라. name과 description만 넣어라.

## 본문 작성 규칙:
1. frontmatter 닫는 --- 바로 다음 줄부터 마크다운 본문 시작 (빈 줄 하나 후 # 제목)
2. 한국어 강의안 슬라이드 제작에 최적화
3. 원본 템플릿의 흐름 패턴(도입-전개-결론)과 톤앤매너 반영
4. 슬라이드별 콘텐츠 밀도와 시각 자료 배치 가이드 포함
5. AI가 이 SKILL.md만 읽고도 동일한 스타일의 강의안을 만들 수 있게 구체적 작성
6. When to Use / Core Rules / Phase별 단계 / Output 형식 명확히 구분
7. 트리거 조건을 구체적으로 (어떤 사용자 발화/상황에서 활성화되는지)
8. 내장 참조 스킬의 구조를 참고하되 템플릿 분석 결과 우선 반영
9. 과거 생성 스킬이 있으면 그 스타일 유지하면서 발전

## 출력 형식 (위반 시 파일 사용 불가):
- 출력의 첫 줄은 반드시 --- (대시 3개. 앞에 공백/빈줄/코드블록 절대 금지)
- 전체를 \`\`\`markdown 코드블록으로 감싸지 마라. 순수 텍스트 그대로 출력
- SKILL.md 전체를 출력하라`

  try {
    let result: string

    if (provider === 'claude') {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 8000,
          messages: [{ role: 'user', content: generatePrompt }]
        })
      })

      if (!res.ok) {
        const errBody = await res.text()
        return c.json({ error: `Claude API 오류: ${errBody}` }, 500)
      }
      const data = await res.json() as any
      result = data.content?.[0]?.text || ''
    } else if (provider === 'openai') {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: generatePrompt }],
          max_tokens: 8000,
          temperature: 0.5
        })
      })

      if (!res.ok) {
        const errBody = await res.text()
        return c.json({ error: `OpenAI API 오류: ${errBody}` }, 500)
      }
      const data = await res.json() as any
      result = data.choices?.[0]?.message?.content || ''
    } else {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: generatePrompt }] }],
          generationConfig: { temperature: 0.5, maxOutputTokens: 8000 }
        })
      })

      if (!res.ok) {
        const errBody = await res.text()
        return c.json({ error: `Gemini API 오류: ${errBody}` }, 500)
      }
      const data = await res.json() as any
      result = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    }

    // ============================================================
    // YAML frontmatter 강제 보정 후처리 (Claude 업로드 규격 준수)
    // ============================================================
    let finalResult = result.trim()

    // 1) 코드블록 감싸기 제거 (```markdown ... ``` 패턴)
    finalResult = finalResult.replace(/^```(?:markdown|md|yaml)?\s*\n?/i, '').replace(/\n?```\s*$/, '').trim()

    // 2) name 규격 교정 함수: 영문소문자+숫자+하이픈만 허용, 최대 64자
    function sanitizeName(raw: string): string {
      // 한글은 제거하고 영문만 남김
      let cleaned = raw
        .toLowerCase()
        .replace(/[가-힣ㄱ-ㅎㅏ-ㅣ]+/g, '') // 한글 제거
        .replace(/[^a-z0-9\s-]/g, '')       // 영문소문자, 숫자, 하이픈, 공백만 남김
        .trim()
        .replace(/\s+/g, '-')               // 공백 → 하이픈
        .replace(/-+/g, '-')                // 연속 하이픈 정리
        .replace(/^-|-$/g, '')              // 앞뒤 하이픈 제거
        .substring(0, 64)
      return cleaned || 'ai-lecture-slide-generator'
    }

    // 3) description 규격 교정: 한 줄, 1024자, XML 태그 제거
    function sanitizeDescription(raw: string): string {
      return raw
        .replace(/\n/g, ' ')               // 줄바꿈 → 공백
        .replace(/<[^>]*>/g, '')            // XML 태그 제거
        .replace(/"/g, "'")               // 쌍따옴표 → 작은따옴표
        .trim()
        .substring(0, 1024)
    }

    // 4) frontmatter 파싱 및 검증
    const fmRegex = /^---\s*\n([\s\S]*?)\n---/
    const fmMatch = finalResult.match(fmRegex)

    if (fmMatch) {
      // frontmatter가 있으면 name/description 검증 및 교정
      const fmBody = fmMatch[1]
      const nameMatch = fmBody.match(/^name:\s*(.+)$/m)
      const descMatch = fmBody.match(/^description:\s*["']?(.+?)["']?\s*$/m)

      let name = nameMatch ? nameMatch[1].trim().replace(/["']/g, '') : ''
      let desc = descMatch ? descMatch[1].trim() : ''

      // name 규격 위반 체크 (한글, 대문자, 언더스코어, 공백, 64자 초과)
      const isNameValid = /^[a-z0-9][a-z0-9-]*$/.test(name) && name.length <= 64

      if (!isNameValid || !name) {
        // name이 규격에 안 맞으면 교정
        const titleMatch2 = finalResult.match(/^#\s+(.+)/m)
        const rawName = name || (titleMatch2 ? titleMatch2[1] : '') || templateAnalysis?.title || 'ai-lecture-skill'
        name = sanitizeName(rawName)
      }

      if (!desc) {
        desc = (templateAnalysis?.topic || '강의안') + ' 관련 강의안 슬라이드를 생성하는 스킬. 사용자가 강의안, 슬라이드, 프레젠테이션 생성을 요청하거나 PDF/PPTX 템플릿을 제공할 때 활성화.'
      }
      desc = sanitizeDescription(desc)

      // 기존 frontmatter를 교정된 것으로 교체 (name + description만)
      const newFm = `---\nname: ${name}\ndescription: "${desc}"\n---`
      finalResult = finalResult.replace(fmRegex, newFm)

    } else {
      // frontmatter가 아예 없으면 자동 생성
      const titleMatch3 = finalResult.match(/^#\s+(.+)/m)
      const rawName = (titleMatch3 ? titleMatch3[1] : '') || templateAnalysis?.title || 'ai-lecture-skill'
      const name = sanitizeName(rawName)

      const topicDesc = templateAnalysis?.topic || '강의안 슬라이드 생성'
      const desc = sanitizeDescription(
        topicDesc + ' 관련 강의안 슬라이드를 생성하는 스킬. 사용자가 강의안, 슬라이드, 프레젠테이션 생성을 요청하거나 PDF/PPTX 템플릿을 제공할 때 활성화.'
      )

      finalResult = `---\nname: ${name}\ndescription: "${desc}"\n---\n\n${finalResult}`
    }

    // 5) 최종 검증: 첫 줄이 --- 인지 확인
    if (!finalResult.startsWith('---')) {
      finalResult = `---\nname: ai-lecture-slide-generator\ndescription: "강의안 슬라이드를 생성하는 스킬. 사용자가 강의안이나 슬라이드 생성을 요청할 때 활성화."\n---\n\n${finalResult}`
    }

    return c.json({ success: true, skillMd: finalResult })
  } catch (e: any) {
    return c.json({ error: `SKILL.md 생성 오류: ${e.message}` }, 500)
  }
})

// 7) 스킬 저장 (D1)
app.post('/api/skills/save', async (c) => {
  const { title, topic, templateName, skillContent, templateAnalysis, tags } = await c.req.json()

  try {
    const result = await c.env.DB.prepare(
      `INSERT INTO skills (title, topic, template_name, skill_content, template_analysis, matched_skills, tags)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      title || 'Untitled Skill',
      topic || '',
      templateName || '',
      skillContent,
      JSON.stringify(templateAnalysis || {}),
      '[]',
      tags || ''
    ).run()

    return c.json({ success: true, id: result.meta.last_row_id })
  } catch (e: any) {
    return c.json({ error: `저장 오류: ${e.message}` }, 500)
  }
})

// 8) 저장된 스킬 목록 (관리자)
app.get('/api/skills', async (c) => {
  const query = c.req.query('q') || ''
  const page = parseInt(c.req.query('page') || '1')
  const limit = 20
  const offset = (page - 1) * limit

  try {
    let results
    let countResult

    if (query) {
      results = await c.env.DB.prepare(
        `SELECT id, title, topic, template_name, tags, created_at
         FROM skills
         WHERE title LIKE ? OR topic LIKE ? OR tags LIKE ?
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`
      ).bind(`%${query}%`, `%${query}%`, `%${query}%`, limit, offset).all()

      countResult = await c.env.DB.prepare(
        `SELECT COUNT(*) as total FROM skills
         WHERE title LIKE ? OR topic LIKE ? OR tags LIKE ?`
      ).bind(`%${query}%`, `%${query}%`, `%${query}%`).first()
    } else {
      results = await c.env.DB.prepare(
        `SELECT id, title, topic, template_name, tags, created_at
         FROM skills ORDER BY created_at DESC LIMIT ? OFFSET ?`
      ).bind(limit, offset).all()

      countResult = await c.env.DB.prepare('SELECT COUNT(*) as total FROM skills').first()
    }

    return c.json({
      skills: results.results,
      total: (countResult as any)?.total || 0,
      page,
      totalPages: Math.ceil(((countResult as any)?.total || 0) / limit)
    })
  } catch (e: any) {
    return c.json({ error: `조회 오류: ${e.message}` }, 500)
  }
})

// 9) 스킬 상세 조회
app.get('/api/skills/:id', async (c) => {
  const id = c.req.param('id')
  try {
    const skill = await c.env.DB.prepare('SELECT * FROM skills WHERE id = ?').bind(id).first()
    if (!skill) return c.json({ error: '스킬을 찾을 수 없습니다.' }, 404)
    return c.json({ skill })
  } catch (e: any) {
    return c.json({ error: `조회 오류: ${e.message}` }, 500)
  }
})

// 10) 스킬 삭제
app.delete('/api/skills/:id', async (c) => {
  const id = c.req.param('id')
  try {
    await c.env.DB.prepare('DELETE FROM skills WHERE id = ?').bind(id).run()
    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ error: `삭제 오류: ${e.message}` }, 500)
  }
})

// ============================================================
// 메인 HTML 페이지
// ============================================================
app.get('/', (c) => {
  return c.html(mainHTML)
})

app.get('/admin', (c) => {
  return c.html(adminHTML)
})

// ============================================================
// HTML 템플릿
// ============================================================

const mainHTML = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI 강의안 스킬 생성기</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700&display=swap');
    * { font-family: 'Noto Sans KR', sans-serif; }
    .glass { background: rgba(255,255,255,0.85); backdrop-filter: blur(12px); }
    .gradient-bg { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    .step-active { border-color: #667eea; background: #f0f0ff; }
    .step-done { border-color: #22c55e; background: #f0fdf4; }
    .fade-in { animation: fadeIn 0.4s ease; }
    @keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
    .skill-md-preview { font-size: 14px; line-height: 1.7; }
    .skill-md-preview h1 { font-size: 1.5rem; font-weight: 700; margin: 1rem 0 0.5rem; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.3rem; }
    .skill-md-preview h2 { font-size: 1.25rem; font-weight: 600; margin: 0.8rem 0 0.4rem; }
    .skill-md-preview h3 { font-size: 1.1rem; font-weight: 600; margin: 0.6rem 0 0.3rem; }
    .skill-md-preview ul, .skill-md-preview ol { padding-left: 1.5rem; margin: 0.3rem 0; }
    .skill-md-preview code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 13px; }
    .skill-md-preview pre { background: #1f2937; color: #e5e7eb; padding: 1rem; border-radius: 8px; overflow-x: auto; margin: 0.5rem 0; }
    .skill-md-preview pre code { background: transparent; color: inherit; }
    .skill-md-preview table { width: 100%; border-collapse: collapse; margin: 0.5rem 0; }
    .skill-md-preview th, .skill-md-preview td { border: 1px solid #e5e7eb; padding: 6px 10px; text-align: left; }
    .skill-md-preview th { background: #f9fafb; font-weight: 600; }
    .spinner { border: 3px solid #e5e7eb; border-top: 3px solid #667eea; border-radius: 50%; width: 24px; height: 24px; animation: spin 0.8s linear infinite; display: inline-block; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .toast { position: fixed; top: 20px; right: 20px; z-index: 9999; padding: 12px 20px; border-radius: 10px; color: white; font-weight: 500; animation: slideIn 0.3s ease; }
    @keyframes slideIn { from { transform: translateX(100%); opacity:0; } to { transform: translateX(0); opacity:1; } }
    .skill-card { transition: all 0.2s; }
    .skill-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .skill-card.selected { ring: 2px; border-color: #667eea; background: #f0f0ff; }
  </style>
</head>
<body class="min-h-screen bg-gray-50">
  <!-- 헤더 -->
  <header class="gradient-bg text-white py-6 shadow-lg">
    <div class="max-w-6xl mx-auto px-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="bg-white/20 p-3 rounded-xl">
          <i class="fas fa-wand-magic-sparkles text-2xl"></i>
        </div>
        <div>
          <h1 class="text-2xl font-bold">AI 강의안 스킬 생성기</h1>
          <p class="text-white/80 text-sm">PDF 템플릿 분석 → 내장 스킬 참조 → SKILL.md 자동 생성</p>
        </div>
      </div>
      <a href="/admin" class="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm transition">
        <i class="fas fa-cog mr-1"></i> 관리자
      </a>
    </div>
  </header>

  <main class="max-w-6xl mx-auto px-4 py-8">
    <!-- ========== STEP 0: API 키 설정 ========== -->
    <div id="step0" class="glass rounded-2xl p-6 shadow-md mb-6 border-2 border-indigo-400 step-active">
      <div class="flex items-center gap-2 mb-4">
        <span class="bg-indigo-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">0</span>
        <h2 class="text-lg font-bold text-gray-800">AI API 키 설정</h2>
        <span id="step0Badge" class="hidden bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
          <i class="fas fa-check mr-1"></i>연결 완료
        </span>
      </div>

      <div class="space-y-3">
        <h3 class="font-semibold text-gray-700"><i class="fas fa-brain mr-1 text-indigo-500"></i> AI 프로바이더 선택 및 API 키 입력</h3>
        <div class="flex gap-2">
          <select id="aiProvider" class="border rounded-lg px-3 py-2 text-sm bg-white">
            <option value="claude">Claude (Anthropic)</option>
            <option value="openai">OpenAI</option>
            <option value="gemini">Gemini</option>
          </select>
          <input id="aiApiKey" type="password" placeholder="API 키를 입력하세요"
            class="flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none">
          <button onclick="verifyAiKey()" id="btnVerifyAi"
            class="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap">
            검증
          </button>
        </div>
        <p id="aiKeyStatus" class="text-sm text-gray-500">AI 프로바이더를 선택하고 API 키를 입력하세요.</p>
      </div>
    </div>

    <!-- ========== STEP 1: PDF 업로드 ========== -->
    <div id="step1" class="glass rounded-2xl p-6 shadow-md mb-6 border-2 border-gray-200 opacity-50 pointer-events-none">
      <div class="flex items-center gap-2 mb-4">
        <span class="bg-gray-400 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" id="step1Num">1</span>
        <h2 class="text-lg font-bold text-gray-800">템플릿 PDF 업로드 & 구조 분석</h2>
        <span id="step1Badge" class="hidden bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
          <i class="fas fa-check mr-1"></i>분석 완료
        </span>
      </div>

      <div class="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-indigo-400 transition cursor-pointer" id="dropZone">
        <input type="file" id="pdfInput" accept=".pdf,.pptx" class="hidden">
        <i class="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-3"></i>
        <p class="text-gray-600 font-medium">PDF 또는 PPTX 파일을 드래그하거나 클릭하여 업로드</p>
        <p class="text-gray-400 text-sm mt-1">최대 10MB</p>
      </div>
      <div id="fileInfo" class="hidden mt-3 flex items-center gap-2 text-sm text-gray-600">
        <i class="fas fa-file-pdf text-red-500"></i>
        <span id="fileName"></span>
        <span id="fileSize" class="text-gray-400"></span>
      </div>
      <button onclick="analyzePdf()" id="btnAnalyze" class="hidden mt-4 bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium transition">
        <i class="fas fa-microscope mr-2"></i>AI 구조 분석 시작
      </button>

      <div id="analysisResult" class="hidden mt-4 fade-in">
        <h3 class="font-semibold text-gray-700 mb-2"><i class="fas fa-chart-bar mr-1 text-indigo-500"></i> 분석 결과</h3>
        <div id="analysisContent" class="bg-gray-50 rounded-xl p-4 text-sm space-y-2"></div>
      </div>
    </div>

    <!-- ========== STEP 2: 스킬 참조 선택 (내장 + 과거) ========== -->
    <div id="step2" class="glass rounded-2xl p-6 shadow-md mb-6 border-2 border-gray-200 opacity-50 pointer-events-none">
      <div class="flex items-center gap-2 mb-4">
        <span class="bg-gray-400 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" id="step2Num">2</span>
        <h2 class="text-lg font-bold text-gray-800">참조 스킬 선택</h2>
        <span id="step2Badge" class="hidden bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
          <i class="fas fa-check mr-1"></i>선택 완료
        </span>
      </div>

      <!-- 내장 스킬 -->
      <div class="mb-6">
        <h3 class="font-semibold text-gray-700 mb-3">
          <i class="fas fa-cube mr-1 text-indigo-500"></i> 내장 참조 스킬
          <span class="text-xs text-gray-400 font-normal ml-2">Anthropic 공식 스킬 기반 · 클릭하여 선택/해제</span>
        </h3>
        <div id="builtInSkillList" class="grid md:grid-cols-3 gap-3"></div>
      </div>

      <!-- 과거 내 스킬 -->
      <div>
        <h3 class="font-semibold text-gray-700 mb-3">
          <i class="fas fa-history mr-1 text-purple-500"></i> 과거 내 스킬 참조
          <span class="text-xs text-gray-400 font-normal ml-2">DB에 저장된 유사 스킬 자동 검색</span>
        </h3>
        <div id="pastSkillsLoading" class="text-sm text-gray-400"><span class="spinner"></span> 유사 스킬 검색 중...</div>
        <div id="pastSkillList" class="hidden space-y-2"></div>
        <p id="pastSkillEmpty" class="hidden text-sm text-gray-400"><i class="fas fa-inbox mr-1"></i> 저장된 유사 스킬이 없습니다. 생성 후 저장하면 이후 참조로 활용됩니다.</p>
      </div>

      <button onclick="confirmSkillSelection()" id="btnConfirmSkills"
        class="mt-4 bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium transition">
        <i class="fas fa-check mr-2"></i>선택 완료 → 생성 단계로
      </button>
    </div>

    <!-- ========== STEP 3: SKILL.md 생성 ========== -->
    <div id="step3" class="glass rounded-2xl p-6 shadow-md mb-6 border-2 border-gray-200 opacity-50 pointer-events-none">
      <div class="flex items-center gap-2 mb-4">
        <span class="bg-gray-400 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" id="step3Num">3</span>
        <h2 class="text-lg font-bold text-gray-800">SKILL.md 생성</h2>
      </div>

      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-1">추가 요구사항 (선택)</label>
        <textarea id="draftText" rows="4" placeholder="강의 주제, 핵심 내용, 타겟 청중 등 추가 정보를 입력하세요..."
          class="w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none resize-y"></textarea>
      </div>

      <!-- 선택된 참조 요약 -->
      <div id="selectedRefSummary" class="mb-4 p-3 bg-indigo-50 rounded-xl text-sm text-indigo-700 hidden">
        <i class="fas fa-info-circle mr-1"></i> <span id="refSummaryText"></span>
      </div>

      <button onclick="generateSkill()" id="btnGenerate"
        class="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-bold text-lg transition shadow-lg">
        <i class="fas fa-wand-magic-sparkles mr-2"></i>SKILL.md 생성하기
      </button>

      <div id="generateResult" class="hidden mt-6 fade-in">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-semibold text-gray-700"><i class="fas fa-file-code mr-1 text-indigo-500"></i> 생성된 SKILL.md</h3>
          <div class="flex gap-2">
            <button onclick="copySkillMd()" class="bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg text-sm transition">
              <i class="fas fa-copy mr-1"></i>복사
            </button>
            <button onclick="downloadSkillMd()" class="bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg text-sm transition">
              <i class="fas fa-download mr-1"></i>다운로드
            </button>
            <button onclick="saveSkillToDb()" class="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm transition">
              <i class="fas fa-database mr-1"></i>DB 저장
            </button>
          </div>
        </div>
        <div class="flex gap-2 mb-3">
          <button onclick="showTab('preview')" id="tabPreview" class="px-4 py-1.5 rounded-lg text-sm font-medium bg-indigo-100 text-indigo-700">미리보기</button>
          <button onclick="showTab('raw')" id="tabRaw" class="px-4 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-600">마크다운 원본</button>
        </div>
        <div id="previewPane" class="bg-white rounded-xl p-6 border skill-md-preview max-h-[600px] overflow-y-auto"></div>
        <div id="rawPane" class="hidden">
          <textarea id="rawSkillMd" class="w-full h-[600px] font-mono text-sm border rounded-xl p-4 bg-gray-900 text-green-400" readonly></textarea>
        </div>
      </div>
    </div>
  </main>

  <script>
    // ============================================================
    // 상태 관리
    // ============================================================
    const state = {
      aiApiKey: '', aiProvider: 'claude', aiVerified: false,
      uploadedFile: null, analysis: null,
      builtInSkills: [], selectedBuiltInSkillIds: [],
      pastSkills: [], selectedPastSkills: [],
      generatedSkillMd: ''
    };

    // ============================================================
    // 유틸리티
    // ============================================================
    function toast(msg, type = 'info') {
      const colors = { info: 'bg-indigo-500', success: 'bg-green-500', error: 'bg-red-500', warning: 'bg-yellow-500 text-gray-900' };
      const el = document.createElement('div');
      el.className = 'toast ' + (colors[type] || colors.info);
      el.textContent = msg;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 3500);
    }

    function setLoading(btnId, loading) {
      const btn = document.getElementById(btnId);
      if (!btn) return;
      if (loading) {
        btn.dataset.originalHtml = btn.innerHTML;
        btn.innerHTML = '<span class="spinner"></span> 처리 중...';
        btn.disabled = true;
        btn.classList.add('opacity-70');
      } else {
        btn.innerHTML = btn.dataset.originalHtml || btn.innerHTML;
        btn.disabled = false;
        btn.classList.remove('opacity-70');
      }
    }

    function activateStep(stepNum) {
      const el = document.getElementById('step' + stepNum);
      el.classList.remove('opacity-50', 'pointer-events-none');
      el.classList.add('step-active');
      const numEl = document.getElementById('step' + stepNum + 'Num');
      if (numEl) numEl.classList.replace('bg-gray-400', 'bg-indigo-500');
    }

    function completeStep(stepNum) {
      const el = document.getElementById('step' + stepNum);
      el.classList.remove('step-active');
      el.classList.add('step-done');
      const badge = document.getElementById('step' + stepNum + 'Badge');
      if (badge) badge.classList.remove('hidden');
      const numEl = document.getElementById('step' + stepNum + 'Num');
      if (numEl) { numEl.classList.replace('bg-indigo-500', 'bg-green-500'); numEl.classList.replace('bg-gray-400', 'bg-green-500'); }
    }

    // ============================================================
    // STEP 0: API 키 검증
    // ============================================================
    async function verifyAiKey() {
      const key = document.getElementById('aiApiKey').value.trim();
      const provider = document.getElementById('aiProvider').value;
      if (!key) { toast('API 키를 입력해주세요.', 'warning'); return; }

      setLoading('btnVerifyAi', true);
      try {
        const res = await fetch('/api/verify-key', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey: key, provider })
        });
        const data = await res.json();

        if (data.valid) {
          state.aiApiKey = key;
          state.aiProvider = provider;
          state.aiVerified = true;
          document.getElementById('aiKeyStatus').innerHTML =
            '<span class="text-green-600 font-medium"><i class="fas fa-check-circle mr-1"></i>' + data.message + '</span>';
          toast(data.message, 'success');
          completeStep(0);
          document.getElementById('step0Badge').classList.remove('hidden');
          activateStep(1);
        } else {
          document.getElementById('aiKeyStatus').innerHTML =
            '<span class="text-red-500"><i class="fas fa-times-circle mr-1"></i>' + data.error + '</span>';
          toast(data.error, 'error');
        }
      } catch (e) {
        toast('검증 요청 실패: ' + e.message, 'error');
      }
      setLoading('btnVerifyAi', false);
    }

    // ============================================================
    // STEP 1: PDF 업로드 & 분석
    // ============================================================
    const dropZone = document.getElementById('dropZone');
    const pdfInput = document.getElementById('pdfInput');

    dropZone.addEventListener('click', () => pdfInput.click());
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('border-indigo-400', 'bg-indigo-50'); });
    dropZone.addEventListener('dragleave', () => { dropZone.classList.remove('border-indigo-400', 'bg-indigo-50'); });
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('border-indigo-400', 'bg-indigo-50');
      if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
    });
    pdfInput.addEventListener('change', (e) => { if (e.target.files.length) handleFile(e.target.files[0]); });

    function handleFile(file) {
      if (file.size > 10 * 1024 * 1024) { toast('10MB 이하 파일만 업로드 가능합니다.', 'warning'); return; }
      state.uploadedFile = file;
      document.getElementById('fileInfo').classList.remove('hidden');
      document.getElementById('fileName').textContent = file.name;
      document.getElementById('fileSize').textContent = '(' + (file.size / 1024 / 1024).toFixed(1) + 'MB)';
      document.getElementById('btnAnalyze').classList.remove('hidden');
    }

    async function analyzePdf() {
      if (!state.uploadedFile) return;
      setLoading('btnAnalyze', true);

      const formData = new FormData();
      formData.append('file', state.uploadedFile);
      formData.append('apiKey', state.aiApiKey);
      formData.append('provider', state.aiProvider);

      try {
        const res = await fetch('/api/analyze-pdf', { method: 'POST', body: formData });
        const data = await res.json();

        if (data.success && data.analysis) {
          state.analysis = data.analysis;
          renderAnalysis(data.analysis);
          document.getElementById('analysisResult').classList.remove('hidden');
          completeStep(1);
          activateStep(2);

          // 내장 스킬 로드 + 과거 스킬 검색
          loadBuiltInSkills();
          searchPastSkills(data.analysis);

          toast('PDF 구조 분석 완료!', 'success');
        } else {
          toast(data.error || '분석 실패', 'error');
        }
      } catch (e) {
        toast('분석 요청 실패: ' + e.message, 'error');
      }
      setLoading('btnAnalyze', false);
    }

    function renderAnalysis(a) {
      const el = document.getElementById('analysisContent');
      el.innerHTML =
        '<div class="grid md:grid-cols-2 gap-4">' +
          '<div>' +
            '<p class="font-semibold text-indigo-600">' + (a.title || '제목 미확인') + '</p>' +
            '<p class="text-gray-500 text-xs">주제: ' + (a.topic || '-') + ' | 슬라이드: ' + (a.totalSlides || '-') + '장</p>' +
          '</div>' +
          '<div>' +
            '<p class="text-xs font-medium text-gray-600">스타일 분석</p>' +
            '<p class="text-xs text-gray-500">어조: ' + (a.styleAnalysis?.toneAndManner || '-') + '</p>' +
            '<p class="text-xs text-gray-500">밀도: ' + (a.styleAnalysis?.contentDensity || '-') + '</p>' +
            '<p class="text-xs text-gray-500">대상: ' + (a.styleAnalysis?.audienceLevel || '-') + '</p>' +
          '</div>' +
        '</div>' +
        '<div class="mt-3">' +
          '<p class="text-xs font-medium text-gray-600 mb-1">논리 전개</p>' +
          '<p class="text-xs text-gray-500">' + (a.flowPattern || '-') + '</p>' +
        '</div>' +
        '<div class="mt-3">' +
          '<p class="text-xs font-medium text-gray-600 mb-1">핵심 키워드</p>' +
          '<div class="flex flex-wrap gap-1">' +
            (a.keyTopics || []).map(function(k) { return '<span class="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs">' + k + '</span>'; }).join('') +
          '</div>' +
        '</div>';
    }

    // ============================================================
    // STEP 2: 참조 스킬 선택
    // ============================================================
    async function loadBuiltInSkills() {
      try {
        const res = await fetch('/api/built-in-skills');
        const data = await res.json();
        if (data.success) {
          state.builtInSkills = data.skills;
          // 기본적으로 전부 선택
          state.selectedBuiltInSkillIds = data.skills.map(function(s) { return s.id; });
          renderBuiltInSkills(data.skills);
        }
      } catch (e) {
        console.error('내장 스킬 로드 실패:', e);
      }
    }

    function renderBuiltInSkills(skills) {
      const el = document.getElementById('builtInSkillList');
      el.innerHTML = skills.map(function(s) {
        var isSelected = state.selectedBuiltInSkillIds.includes(s.id);
        return '<div class="skill-card p-4 rounded-xl border-2 cursor-pointer ' +
          (isSelected ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 bg-white') +
          '" onclick="toggleBuiltInSkill(\\'' + s.id + '\\')" data-skill-id="' + s.id + '">' +
          '<div class="flex items-start gap-2">' +
            '<input type="checkbox" ' + (isSelected ? 'checked' : '') + ' class="mt-1 accent-indigo-500" onclick="event.stopPropagation();" onchange="toggleBuiltInSkill(\\''+s.id+'\\');">' +
            '<div class="flex-1">' +
              '<p class="font-semibold text-sm text-gray-800">' + s.name + '</p>' +
              '<p class="text-xs text-gray-400 mt-0.5">' + s.source + '</p>' +
              '<p class="text-xs text-gray-500 mt-1 line-clamp-2">' + s.description + '</p>' +
              '<div class="flex flex-wrap gap-1 mt-2">' +
                s.tags.map(function(t) { return '<span class="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded text-xs">' + t + '</span>'; }).join('') +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>';
      }).join('');
    }

    function toggleBuiltInSkill(id) {
      var idx = state.selectedBuiltInSkillIds.indexOf(id);
      if (idx >= 0) {
        state.selectedBuiltInSkillIds.splice(idx, 1);
      } else {
        state.selectedBuiltInSkillIds.push(id);
      }
      renderBuiltInSkills(state.builtInSkills);
    }

    async function searchPastSkills(analysis) {
      document.getElementById('pastSkillsLoading').classList.remove('hidden');
      document.getElementById('pastSkillList').classList.add('hidden');
      document.getElementById('pastSkillEmpty').classList.add('hidden');

      var keywords = (analysis.searchKeywords || analysis.keyTopics || []).slice(0, 5);
      if (!keywords.length) {
        document.getElementById('pastSkillsLoading').classList.add('hidden');
        document.getElementById('pastSkillEmpty').classList.remove('hidden');
        return;
      }

      try {
        var res = await fetch('/api/skills/search-similar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keywords: keywords })
        });
        var data = await res.json();

        document.getElementById('pastSkillsLoading').classList.add('hidden');

        if (data.success && data.skills && data.skills.length > 0) {
          state.pastSkills = data.skills;
          state.selectedPastSkills = data.skills.slice(0, 3); // 상위 3개 기본 선택
          renderPastSkills(data.skills);
          document.getElementById('pastSkillList').classList.remove('hidden');
        } else {
          document.getElementById('pastSkillEmpty').classList.remove('hidden');
        }
      } catch (e) {
        document.getElementById('pastSkillsLoading').classList.add('hidden');
        document.getElementById('pastSkillEmpty').classList.remove('hidden');
      }
    }

    function renderPastSkills(skills) {
      var el = document.getElementById('pastSkillList');
      el.innerHTML = skills.map(function(s) {
        var isSelected = state.selectedPastSkills.some(function(ps) { return ps.id === s.id; });
        return '<div class="skill-card flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer ' +
          (isSelected ? 'border-purple-400 bg-purple-50' : 'border-gray-200 bg-white') +
          '" onclick="togglePastSkill(' + s.id + ')" data-past-id="' + s.id + '">' +
          '<input type="checkbox" ' + (isSelected ? 'checked' : '') + ' class="mt-1 accent-purple-500" onclick="event.stopPropagation();" onchange="togglePastSkill(' + s.id + ');">' +
          '<div class="flex-1">' +
            '<p class="font-semibold text-sm text-gray-800">' + s.title + '</p>' +
            '<p class="text-xs text-gray-500 mt-0.5">' +
              '<span class="mr-2"><i class="fas fa-folder-open mr-1"></i>' + (s.topic || '-') + '</span>' +
              '<span><i class="fas fa-clock mr-1"></i>' + new Date(s.created_at).toLocaleDateString('ko-KR') + '</span>' +
            '</p>' +
            '<p class="text-xs text-gray-400 mt-1 line-clamp-2">' + (s.preview || '') + '</p>' +
            '<div class="flex flex-wrap gap-1 mt-1">' +
              (s.tags || '').split(',').filter(Boolean).map(function(t) { return '<span class="bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded text-xs">' + t.trim() + '</span>'; }).join('') +
            '</div>' +
          '</div>' +
        '</div>';
      }).join('');
    }

    function togglePastSkill(id) {
      var idx = state.selectedPastSkills.findIndex(function(s) { return s.id === id; });
      if (idx >= 0) {
        state.selectedPastSkills.splice(idx, 1);
      } else {
        var skill = state.pastSkills.find(function(s) { return s.id === id; });
        if (skill) state.selectedPastSkills.push(skill);
      }
      renderPastSkills(state.pastSkills);
    }

    function confirmSkillSelection() {
      var builtInCount = state.selectedBuiltInSkillIds.length;
      var pastCount = state.selectedPastSkills.length;

      completeStep(2);
      activateStep(3);

      // 선택 요약 표시
      var summary = '내장 스킬 ' + builtInCount + '개';
      if (pastCount > 0) summary += ' + 과거 스킬 ' + pastCount + '개';
      summary += ' 참조하여 생성합니다.';

      document.getElementById('selectedRefSummary').classList.remove('hidden');
      document.getElementById('refSummaryText').textContent = summary;

      toast('참조 스킬 선택 완료!', 'success');
    }

    // ============================================================
    // STEP 3: SKILL.md 생성
    // ============================================================
    async function generateSkill() {
      setLoading('btnGenerate', true);
      var draftText = document.getElementById('draftText').value.trim();

      try {
        var res = await fetch('/api/generate-skill', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            templateAnalysis: state.analysis,
            selectedBuiltInSkills: state.selectedBuiltInSkillIds,
            pastSkills: state.selectedPastSkills,
            draftText: draftText,
            apiKey: state.aiApiKey,
            provider: state.aiProvider
          })
        });
        var data = await res.json();

        if (data.success && data.skillMd) {
          state.generatedSkillMd = data.skillMd;
          document.getElementById('previewPane').innerHTML = marked.parse(data.skillMd);
          document.getElementById('rawSkillMd').value = data.skillMd;
          document.getElementById('generateResult').classList.remove('hidden');
          toast('SKILL.md 생성 완료!', 'success');
        } else {
          toast(data.error || '생성 실패', 'error');
        }
      } catch (e) {
        toast('생성 요청 실패: ' + e.message, 'error');
      }
      setLoading('btnGenerate', false);
    }

    function showTab(tab) {
      if (tab === 'preview') {
        document.getElementById('previewPane').classList.remove('hidden');
        document.getElementById('rawPane').classList.add('hidden');
        document.getElementById('tabPreview').className = 'px-4 py-1.5 rounded-lg text-sm font-medium bg-indigo-100 text-indigo-700';
        document.getElementById('tabRaw').className = 'px-4 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-600';
      } else {
        document.getElementById('previewPane').classList.add('hidden');
        document.getElementById('rawPane').classList.remove('hidden');
        document.getElementById('tabRaw').className = 'px-4 py-1.5 rounded-lg text-sm font-medium bg-indigo-100 text-indigo-700';
        document.getElementById('tabPreview').className = 'px-4 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-600';
      }
    }

    function copySkillMd() {
      navigator.clipboard.writeText(state.generatedSkillMd);
      toast('클립보드에 복사되었습니다!', 'success');
    }

    function downloadSkillMd() {
      var blob = new Blob([state.generatedSkillMd], { type: 'text/markdown' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'SKILL.md';
      a.click();
      URL.revokeObjectURL(a.href);
    }

    async function saveSkillToDb() {
      try {
        var res = await fetch('/api/skills/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: state.analysis?.title || 'Untitled',
            topic: state.analysis?.topic || '',
            templateName: state.uploadedFile?.name || '',
            skillContent: state.generatedSkillMd,
            templateAnalysis: state.analysis,
            tags: (state.analysis?.keyTopics || []).join(',')
          })
        });
        var data = await res.json();
        if (data.success) {
          toast('DB에 저장되었습니다! (ID: ' + data.id + ')', 'success');
        } else {
          toast(data.error || '저장 실패', 'error');
        }
      } catch (e) {
        toast('저장 요청 실패: ' + e.message, 'error');
      }
    }
  </script>
</body>
</html>`

const adminHTML = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>관리자 - AI 강의안 스킬 생성기</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700&display=swap');
    * { font-family: 'Noto Sans KR', sans-serif; }
    .glass { background: rgba(255,255,255,0.85); backdrop-filter: blur(12px); }
    .gradient-bg { background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); }
    .skill-md-preview { font-size: 14px; line-height: 1.7; }
    .skill-md-preview h1 { font-size: 1.4rem; font-weight: 700; margin: 0.8rem 0 0.4rem; border-bottom: 2px solid #e5e7eb; }
    .skill-md-preview h2 { font-size: 1.2rem; font-weight: 600; margin: 0.6rem 0 0.3rem; }
    .skill-md-preview h3 { font-size: 1.05rem; font-weight: 600; margin: 0.5rem 0 0.2rem; }
    .skill-md-preview ul, .skill-md-preview ol { padding-left: 1.5rem; }
    .skill-md-preview code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 13px; }
    .skill-md-preview pre { background: #1f2937; color: #e5e7eb; padding: 1rem; border-radius: 8px; overflow-x: auto; }
    .skill-md-preview pre code { background: transparent; color: inherit; }
    .skill-md-preview table { width: 100%; border-collapse: collapse; margin: 0.5rem 0; }
    .skill-md-preview th, .skill-md-preview td { border: 1px solid #e5e7eb; padding: 6px 10px; text-align: left; }
    .skill-md-preview th { background: #f9fafb; font-weight: 600; }
    .toast { position: fixed; top: 20px; right: 20px; z-index: 9999; padding: 12px 20px; border-radius: 10px; color: white; font-weight: 500; animation: slideIn 0.3s ease; }
    @keyframes slideIn { from { transform: translateX(100%); opacity:0; } to { transform: translateX(0); opacity:1; } }
  </style>
</head>
<body class="min-h-screen bg-gray-100">
  <header class="gradient-bg text-white py-5 shadow-lg">
    <div class="max-w-6xl mx-auto px-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="bg-white/20 p-3 rounded-xl">
          <i class="fas fa-database text-2xl"></i>
        </div>
        <div>
          <h1 class="text-xl font-bold">관리자 - 저장된 스킬 관리</h1>
          <p class="text-white/70 text-sm">생성된 SKILL.md 검색, 조회, 다운로드</p>
        </div>
      </div>
      <a href="/" class="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm transition">
        <i class="fas fa-home mr-1"></i> 메인
      </a>
    </div>
  </header>

  <main class="max-w-6xl mx-auto px-4 py-8">
    <div class="glass rounded-2xl p-5 shadow-md mb-6">
      <div class="flex gap-3">
        <input id="searchInput" type="text" placeholder="제목, 주제, 태그로 검색..."
          class="flex-1 border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-300 outline-none"
          onkeydown="if(event.key==='Enter') loadSkills()">
        <button onclick="loadSkills()" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium transition">
          <i class="fas fa-search mr-1"></i>검색
        </button>
      </div>
    </div>

    <div id="skillList" class="space-y-3"></div>
    <div id="pagination" class="flex justify-center gap-2 mt-6"></div>

    <div id="modal" class="hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col">
        <div class="flex items-center justify-between p-5 border-b">
          <h3 id="modalTitle" class="font-bold text-lg text-gray-800"></h3>
          <div class="flex gap-2">
            <button onclick="downloadModalSkill()" class="bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg text-sm">
              <i class="fas fa-download mr-1"></i>다운로드
            </button>
            <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600 text-xl px-2">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
        <div id="modalContent" class="p-5 overflow-y-auto skill-md-preview"></div>
      </div>
    </div>
  </main>

  <script>
    var currentPage = 1;
    var currentSkillMd = '';

    function toast(msg, type) {
      type = type || 'info';
      var colors = { info:'bg-blue-500', success:'bg-green-500', error:'bg-red-500' };
      var el = document.createElement('div');
      el.className = 'toast ' + (colors[type] || colors.info);
      el.textContent = msg;
      document.body.appendChild(el);
      setTimeout(function() { el.remove(); }, 3000);
    }

    async function loadSkills(page) {
      page = page || 1;
      currentPage = page;
      var q = document.getElementById('searchInput').value.trim();
      try {
        var res = await fetch('/api/skills?q=' + encodeURIComponent(q) + '&page=' + page);
        var data = await res.json();
        renderList(data.skills || []);
        renderPagination(data.page, data.totalPages, data.total);
      } catch(e) {
        toast('목록 로드 실패: ' + e.message, 'error');
      }
    }

    function renderList(skills) {
      var el = document.getElementById('skillList');
      if (!skills.length) {
        el.innerHTML = '<div class="text-center py-12 text-gray-400"><i class="fas fa-inbox text-4xl mb-3"></i><p>저장된 스킬이 없습니다.</p></div>';
        return;
      }
      el.innerHTML = skills.map(function(s) {
        return '<div class="glass rounded-xl p-4 shadow-sm border hover:shadow-md transition cursor-pointer" onclick="viewSkill(' + s.id + ')">' +
          '<div class="flex items-center justify-between">' +
            '<div class="flex-1">' +
              '<p class="font-semibold text-gray-800">' + s.title + '</p>' +
              '<p class="text-gray-500 text-xs mt-1">' +
                '<span class="mr-3"><i class="fas fa-folder-open mr-1"></i>' + (s.topic || '-') + '</span>' +
                '<span class="mr-3"><i class="fas fa-file mr-1"></i>' + (s.template_name || '-') + '</span>' +
                '<span><i class="fas fa-clock mr-1"></i>' + new Date(s.created_at).toLocaleDateString('ko-KR') + '</span>' +
              '</p>' +
              '<div class="flex flex-wrap gap-1 mt-2">' +
                (s.tags || '').split(',').filter(Boolean).map(function(t) { return '<span class="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-xs">' + t.trim() + '</span>'; }).join('') +
              '</div>' +
            '</div>' +
            '<div class="flex gap-2 ml-4">' +
              '<button onclick="event.stopPropagation(); deleteSkill(' + s.id + ')" class="text-red-400 hover:text-red-600 px-2 py-1 rounded text-sm">' +
                '<i class="fas fa-trash"></i>' +
              '</button>' +
            '</div>' +
          '</div>' +
        '</div>';
      }).join('');
    }

    function renderPagination(page, totalPages, total) {
      var el = document.getElementById('pagination');
      if (totalPages <= 1) { el.innerHTML = '<p class="text-gray-400 text-sm">총 ' + total + '건</p>'; return; }
      var html = '';
      for (var i = 1; i <= totalPages; i++) {
        html += '<button onclick="loadSkills(' + i + ')" class="px-3 py-1 rounded-lg text-sm ' +
          (i === page ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100') + '">' + i + '</button>';
      }
      html += '<span class="text-gray-400 text-sm ml-2">총 ' + total + '건</span>';
      el.innerHTML = html;
    }

    async function viewSkill(id) {
      try {
        var res = await fetch('/api/skills/' + id);
        var data = await res.json();
        if (data.skill) {
          currentSkillMd = data.skill.skill_content;
          document.getElementById('modalTitle').textContent = data.skill.title;
          document.getElementById('modalContent').innerHTML = marked.parse(data.skill.skill_content);
          document.getElementById('modal').classList.remove('hidden');
        }
      } catch(e) {
        toast('상세 조회 실패', 'error');
      }
    }

    function closeModal() {
      document.getElementById('modal').classList.add('hidden');
    }

    function downloadModalSkill() {
      var blob = new Blob([currentSkillMd], { type: 'text/markdown' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'SKILL.md';
      a.click();
    }

    async function deleteSkill(id) {
      if (!confirm('정말 삭제하시겠습니까?')) return;
      try {
        await fetch('/api/skills/' + id, { method: 'DELETE' });
        toast('삭제되었습니다.', 'success');
        loadSkills(currentPage);
      } catch(e) {
        toast('삭제 실패', 'error');
      }
    }

    document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closeModal(); });
    loadSkills();
  </script>
</body>
</html>`

export default app
