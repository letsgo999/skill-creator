import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('/api/*', cors())

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
      // Gemini
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
  // 대용량 파일 안전한 base64 변환 (스택 오버플로우 방지)
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
  "keyTopics": ["핵심 키워드1", "핵심 키워드2", ...],
  "flowPattern": "논리 전개 패턴 설명 (도입-전개-결론 패턴)",
  "styleAnalysis": {
    "toneAndManner": "어조와 매너 (예: 전문적, 친근한 등)",
    "contentDensity": "콘텐츠 밀도 (예: 텍스트 중심, 시각 자료 중심 등)",
    "audienceLevel": "대상 청중 수준 (예: 초급, 중급, 고급)"
  },
  "searchKeywords": ["SkillsMP 검색에 사용할 키워드1", "키워드2", "키워드3"]
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
                source: {
                  type: 'base64',
                  media_type: 'application/pdf',
                  data: base64
                }
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
      // Gemini
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: analysisPrompt },
              {
                inline_data: {
                  mime_type: 'application/pdf',
                  data: base64
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 4000
          }
        })
      })

      if (!res.ok) {
        const errBody = await res.text()
        return c.json({ error: `Gemini API 오류 (${res.status}): ${errBody}` }, 500)
      }

      const data = await res.json() as any
      result = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    }

    // JSON 파싱 시도 — AI 응답에서 코드블록 제거 후 추출
    let cleanResult = result.trim()
    // ```json ... ``` 코드블록 제거
    cleanResult = cleanResult.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/,'').trim()
    
    // 가장 바깥쪽 중괄호 블록 추출
    const jsonMatch = cleanResult.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        const analysis = JSON.parse(jsonMatch[0])
        return c.json({ success: true, analysis })
      } catch (parseErr: any) {
        // JSON 파싱 실패 시 — 주석, trailing comma 등 정리 후 재시도
        let fixedJson = jsonMatch[0]
          .replace(/,\s*([}\]])/g, '$1')       // trailing comma 제거
          .replace(/\/\/.*$/gm, '')            // 한줄 주석 제거
          .replace(/\.\.\.\s*/g, '')           // ... 제거
          .replace(/([{,]\s*)(\w+)\s*:/g, '$1"$2":') // 따옴표 없는 키에 따옴표 추가
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

// 3) SkillsMP 검색
app.post('/api/search-skills', async (c) => {
  const { keywords, skillsmpApiKey } = await c.req.json<{ keywords: string[]; skillsmpApiKey: string }>()

  if (!keywords?.length || !skillsmpApiKey) {
    return c.json({ error: '검색 키워드와 SkillsMP API 키가 필요합니다.' }, 400)
  }

  try {
    const searchQuery = keywords.join(' ') + ' presentation slide'
    const res = await fetch(`https://skillsmp.com/api/v1/skills/ai-search?q=${encodeURIComponent(searchQuery)}`, {
      headers: {
        'Authorization': `Bearer ${skillsmpApiKey}`,
        'Accept': 'application/json'
      }
    })

    if (!res.ok) {
      // fallback: 키워드 검색
      const res2 = await fetch(`https://skillsmp.com/api/v1/skills/search?q=${encodeURIComponent(searchQuery)}&limit=10&sortBy=stars`, {
        headers: {
          'Authorization': `Bearer ${skillsmpApiKey}`,
          'Accept': 'application/json'
        }
      })

      if (!res2.ok) {
        const errText = await res2.text()
        return c.json({ error: `SkillsMP API 오류 (${res2.status}): ${errText}` }, 500)
      }

      const data = await res2.json()
      return c.json({ success: true, skills: data })
    }

    const data = await res.json()
    return c.json({ success: true, skills: data })
  } catch (e: any) {
    return c.json({ error: `SkillsMP 검색 오류: ${e.message}` }, 500)
  }
})

// 4) SKILL.md 생성
app.post('/api/generate-skill', async (c) => {
  const { templateAnalysis, matchedSkills, draftText, apiKey, provider } = await c.req.json<{
    templateAnalysis: any
    matchedSkills: any[]
    draftText: string
    apiKey: string
    provider: string
  }>()

  if (!templateAnalysis || !apiKey) {
    return c.json({ error: '템플릿 분석 결과와 API 키가 필요합니다.' }, 400)
  }

  const skillsReference = matchedSkills?.length
    ? `\n\n참조할 인기 스킬 목록:\n${matchedSkills.map((s: any, i: number) => `${i + 1}. ${s.name || s.title || 'N/A'} - ${s.description || ''}`).join('\n')}`
    : ''

  const draftSection = draftText
    ? `\n\n사용자 초안 텍스트:\n${draftText}`
    : ''

  const generatePrompt = `당신은 AI 에이전트용 SKILL.md 문서를 작성하는 전문가입니다.

아래 정보를 종합하여, Claude Code / ChatGPT / Codex가 즉시 사용할 수 있는 고품질 SKILL.md 파일을 생성해주세요.

## 분석된 템플릿 구조:
${JSON.stringify(templateAnalysis, null, 2)}
${skillsReference}
${draftSection}

## SKILL.md 작성 규칙:
1. 표준 SKILL.md 포맷을 따를 것 (name, version, description, triggers, phases)
2. 한국어 강의안 슬라이드 제작에 최적화할 것
3. 원본 템플릿의 흐름 패턴(도입-전개-결론)과 톤앤매너를 반영할 것
4. 슬라이드별 콘텐츠 밀도와 시각 자료 배치 가이드를 포함할 것
5. AI가 이 SKILL.md만 읽고도 동일한 스타일의 강의안을 만들 수 있게 구체적으로 작성할 것
6. When to Use / Core Rules / Phase별 단계 / Output 형식을 명확히 할 것

출력은 마크다운 SKILL.md 문서 전체를 출력하세요.`

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

    return c.json({ success: true, skillMd: result })
  } catch (e: any) {
    return c.json({ error: `SKILL.md 생성 오류: ${e.message}` }, 500)
  }
})

// 5) 스킬 저장 (D1)
app.post('/api/skills/save', async (c) => {
  const { title, topic, templateName, skillContent, templateAnalysis, matchedSkills, tags } = await c.req.json()

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
      JSON.stringify(matchedSkills || []),
      tags || ''
    ).run()

    return c.json({ success: true, id: result.meta.last_row_id })
  } catch (e: any) {
    return c.json({ error: `저장 오류: ${e.message}` }, 500)
  }
})

// 6) 저장된 스킬 목록 (관리자)
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

// 7) 스킬 상세 조회
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

// 8) 스킬 삭제
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

// 관리자 모드 페이지
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
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
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
          <p class="text-white/80 text-sm">PPTX/PDF 템플릿 분석 → SkillsMP 매칭 → SKILL.md 자동 생성</p>
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
        <h2 class="text-lg font-bold text-gray-800">API 키 설정</h2>
        <span id="step0Badge" class="hidden bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
          <i class="fas fa-check mr-1"></i>연결 완료
        </span>
      </div>

      <div class="grid md:grid-cols-2 gap-4">
        <!-- AI API -->
        <div class="space-y-3">
          <h3 class="font-semibold text-gray-700"><i class="fas fa-brain mr-1 text-indigo-500"></i> AI API 키</h3>
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

        <!-- SkillsMP API -->
        <div class="space-y-3">
          <h3 class="font-semibold text-gray-700"><i class="fas fa-store mr-1 text-purple-500"></i> SkillsMP API 키</h3>
          <div class="flex gap-2">
            <input id="skillsmpApiKey" type="password" placeholder="sk_live_skillsmp_..."
              class="flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-300 focus:border-purple-400 outline-none">
            <button onclick="verifySkillsmpKey()" id="btnVerifySkillsmp"
              class="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap">
              검증
            </button>
          </div>
          <p id="skillsmpKeyStatus" class="text-sm text-gray-500">SkillsMP 마켓플레이스 API 키를 입력하세요.</p>
        </div>
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

      <!-- 분석 결과 -->
      <div id="analysisResult" class="hidden mt-4 fade-in">
        <h3 class="font-semibold text-gray-700 mb-2"><i class="fas fa-chart-bar mr-1 text-indigo-500"></i> 분석 결과</h3>
        <div id="analysisContent" class="bg-gray-50 rounded-xl p-4 text-sm space-y-2"></div>
      </div>
    </div>

    <!-- ========== STEP 2: 스킬 검색 ========== -->
    <div id="step2" class="glass rounded-2xl p-6 shadow-md mb-6 border-2 border-gray-200 opacity-50 pointer-events-none">
      <div class="flex items-center gap-2 mb-4">
        <span class="bg-gray-400 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" id="step2Num">2</span>
        <h2 class="text-lg font-bold text-gray-800">SkillsMP 유사 스킬 검색</h2>
        <span id="step2Badge" class="hidden bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
          <i class="fas fa-check mr-1"></i>검색 완료
        </span>
      </div>
      <div id="searchKeywords" class="flex flex-wrap gap-2 mb-3"></div>
      <button onclick="searchSkills()" id="btnSearch"
        class="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2.5 rounded-lg font-medium transition">
        <i class="fas fa-search mr-2"></i>유사 스킬 검색
      </button>
      <div id="skillResults" class="hidden mt-4 space-y-3 fade-in"></div>
    </div>

    <!-- ========== STEP 3: 초안 & SKILL.md 생성 ========== -->
    <div id="step3" class="glass rounded-2xl p-6 shadow-md mb-6 border-2 border-gray-200 opacity-50 pointer-events-none">
      <div class="flex items-center gap-2 mb-4">
        <span class="bg-gray-400 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" id="step3Num">3</span>
        <h2 class="text-lg font-bold text-gray-800">SKILL.md 생성</h2>
      </div>

      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-1">초안 텍스트 (선택사항)</label>
        <textarea id="draftText" rows="4" placeholder="강의 주제, 핵심 내용, 타겟 청중 등 추가 정보를 입력하세요..."
          class="w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none resize-y"></textarea>
      </div>

      <button onclick="generateSkill()" id="btnGenerate"
        class="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-bold text-lg transition shadow-lg">
        <i class="fas fa-wand-magic-sparkles mr-2"></i>SKILL.md 생성하기
      </button>

      <!-- 결과 -->
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
      skillsmpApiKey: '', skillsmpVerified: false,
      uploadedFile: null, analysis: null,
      searchKeywordList: [], matchedSkills: [],
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
          checkAllKeys();
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

    async function verifySkillsmpKey() {
      const key = document.getElementById('skillsmpApiKey').value.trim();
      if (!key) { toast('SkillsMP API 키를 입력해주세요.', 'warning'); return; }

      setLoading('btnVerifySkillsmp', true);
      try {
        // SkillsMP API로 간단한 검색 시도
        const res = await fetch('/api/search-skills', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keywords: ['presentation'], skillsmpApiKey: key })
        });
        const data = await res.json();

        if (data.success) {
          state.skillsmpApiKey = key;
          state.skillsmpVerified = true;
          document.getElementById('skillsmpKeyStatus').innerHTML =
            '<span class="text-green-600 font-medium"><i class="fas fa-check-circle mr-1"></i>SkillsMP API 연결 성공</span>';
          toast('SkillsMP API 연결 성공!', 'success');
          checkAllKeys();
        } else {
          document.getElementById('skillsmpKeyStatus').innerHTML =
            '<span class="text-red-500"><i class="fas fa-times-circle mr-1"></i>' + (data.error || 'API 키 오류') + '</span>';
          toast(data.error || 'SkillsMP API 키 오류', 'error');
        }
      } catch (e) {
        toast('SkillsMP 검증 실패: ' + e.message, 'error');
      }
      setLoading('btnVerifySkillsmp', false);
    }

    function checkAllKeys() {
      if (state.aiVerified && state.skillsmpVerified) {
        completeStep(0);
        document.getElementById('step0Badge').classList.remove('hidden');
        activateStep(1);
      }
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

          // 검색 키워드 세팅
          const kws = data.analysis.searchKeywords || data.analysis.keyTopics || [];
          state.searchKeywordList = kws;
          renderSearchKeywords(kws);

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
      el.innerHTML = \`
        <div class="grid md:grid-cols-2 gap-4">
          <div>
            <p class="font-semibold text-indigo-600">\${a.title || '제목 미확인'}</p>
            <p class="text-gray-500 text-xs">주제: \${a.topic || '-'} | 슬라이드: \${a.totalSlides || '-'}장</p>
          </div>
          <div>
            <p class="text-xs font-medium text-gray-600">스타일 분석</p>
            <p class="text-xs text-gray-500">어조: \${a.styleAnalysis?.toneAndManner || '-'}</p>
            <p class="text-xs text-gray-500">밀도: \${a.styleAnalysis?.contentDensity || '-'}</p>
            <p class="text-xs text-gray-500">대상: \${a.styleAnalysis?.audienceLevel || '-'}</p>
          </div>
        </div>
        <div class="mt-3">
          <p class="text-xs font-medium text-gray-600 mb-1">논리 전개</p>
          <p class="text-xs text-gray-500">\${a.flowPattern || '-'}</p>
        </div>
        <div class="mt-3">
          <p class="text-xs font-medium text-gray-600 mb-1">구조 분석</p>
          <div class="grid grid-cols-3 gap-2 text-xs">
            <div class="bg-blue-50 rounded-lg p-2">
              <p class="font-medium text-blue-700">도입부</p>
              \${(a.structure?.introduction || []).map(s => '<p class="text-gray-500">- ' + s + '</p>').join('')}
            </div>
            <div class="bg-indigo-50 rounded-lg p-2">
              <p class="font-medium text-indigo-700">본론</p>
              \${(a.structure?.mainContent || []).slice(0,5).map(s => '<p class="text-gray-500">- ' + s + '</p>').join('')}
              \${(a.structure?.mainContent || []).length > 5 ? '<p class="text-gray-400">...외 ' + ((a.structure?.mainContent || []).length - 5) + '개</p>' : ''}
            </div>
            <div class="bg-purple-50 rounded-lg p-2">
              <p class="font-medium text-purple-700">결론</p>
              \${(a.structure?.conclusion || []).map(s => '<p class="text-gray-500">- ' + s + '</p>').join('')}
            </div>
          </div>
        </div>
        <div class="mt-3">
          <p class="text-xs font-medium text-gray-600 mb-1">핵심 키워드</p>
          <div class="flex flex-wrap gap-1">
            \${(a.keyTopics || []).map(k => '<span class="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs">' + k + '</span>').join('')}
          </div>
        </div>
      \`;
    }

    function renderSearchKeywords(kws) {
      const el = document.getElementById('searchKeywords');
      el.innerHTML = kws.map(k =>
        '<span class="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium"><i class="fas fa-tag mr-1"></i>' + k + '</span>'
      ).join('');
    }

    // ============================================================
    // STEP 2: SkillsMP 검색
    // ============================================================
    async function searchSkills() {
      if (!state.searchKeywordList.length) { toast('검색 키워드가 없습니다.', 'warning'); return; }
      setLoading('btnSearch', true);

      try {
        const res = await fetch('/api/search-skills', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keywords: state.searchKeywordList, skillsmpApiKey: state.skillsmpApiKey })
        });
        const data = await res.json();

        if (data.success) {
          const skills = data.skills?.results || data.skills?.data || data.skills || [];
          state.matchedSkills = Array.isArray(skills) ? skills.slice(0, 5) : [];
          renderSkillResults(state.matchedSkills);
          document.getElementById('skillResults').classList.remove('hidden');
          completeStep(2);
          activateStep(3);
          toast('유사 스킬 ' + state.matchedSkills.length + '개 발견!', 'success');
        } else {
          toast(data.error || '검색 실패', 'error');
        }
      } catch (e) {
        toast('검색 요청 실패: ' + e.message, 'error');
      }
      setLoading('btnSearch', false);
    }

    function renderSkillResults(skills) {
      const el = document.getElementById('skillResults');
      if (!skills.length) {
        el.innerHTML = '<p class="text-gray-500 text-sm">검색 결과가 없습니다. 키워드를 수정해보세요.</p>';
        return;
      }
      el.innerHTML = '<h3 class="font-semibold text-gray-700 text-sm mb-2">매칭된 스킬 Top ' + skills.length + '</h3>' +
        skills.map((s, i) => \`
          <div class="bg-white rounded-xl p-4 border hover:shadow-md transition">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <p class="font-semibold text-gray-800">\${i+1}. \${s.name || s.title || s.slug || 'N/A'}</p>
                <p class="text-gray-500 text-xs mt-1 line-clamp-2">\${s.description || ''}</p>
              </div>
              <div class="flex items-center gap-3 text-xs text-gray-400 ml-4">
                \${s.stars ? '<span><i class="fas fa-star text-yellow-400"></i> ' + s.stars + '</span>' : ''}
                \${s.author ? '<span>by ' + s.author + '</span>' : ''}
              </div>
            </div>
            \${s.url || s.homepage ? '<a href="' + (s.url || s.homepage) + '" target="_blank" class="text-indigo-500 text-xs hover:underline mt-1 inline-block"><i class="fas fa-external-link-alt mr-1"></i>상세보기</a>' : ''}
          </div>
        \`).join('');
    }

    // ============================================================
    // STEP 3: SKILL.md 생성
    // ============================================================
    async function generateSkill() {
      setLoading('btnGenerate', true);
      const draftText = document.getElementById('draftText').value.trim();

      try {
        const res = await fetch('/api/generate-skill', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            templateAnalysis: state.analysis,
            matchedSkills: state.matchedSkills,
            draftText,
            apiKey: state.aiApiKey,
            provider: state.aiProvider
          })
        });
        const data = await res.json();

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
      const blob = new Blob([state.generatedSkillMd], { type: 'text/markdown' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'SKILL.md';
      a.click();
      URL.revokeObjectURL(a.href);
    }

    async function saveSkillToDb() {
      try {
        const res = await fetch('/api/skills/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: state.analysis?.title || 'Untitled',
            topic: state.analysis?.topic || '',
            templateName: state.uploadedFile?.name || '',
            skillContent: state.generatedSkillMd,
            templateAnalysis: state.analysis,
            matchedSkills: state.matchedSkills,
            tags: (state.analysis?.keyTopics || []).join(',')
          })
        });
        const data = await res.json();
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
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
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
    <!-- 검색 -->
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

    <!-- 결과 리스트 -->
    <div id="skillList" class="space-y-3"></div>

    <!-- 페이지네이션 -->
    <div id="pagination" class="flex justify-center gap-2 mt-6"></div>

    <!-- 스킬 상세 모달 -->
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
    let currentPage = 1;
    let currentSkillMd = '';

    function toast(msg, type='info') {
      const colors = { info:'bg-blue-500', success:'bg-green-500', error:'bg-red-500' };
      const el = document.createElement('div');
      el.className = 'toast ' + (colors[type] || colors.info);
      el.textContent = msg;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 3000);
    }

    async function loadSkills(page = 1) {
      currentPage = page;
      const q = document.getElementById('searchInput').value.trim();
      try {
        const res = await fetch('/api/skills?q=' + encodeURIComponent(q) + '&page=' + page);
        const data = await res.json();
        renderList(data.skills || []);
        renderPagination(data.page, data.totalPages, data.total);
      } catch(e) {
        toast('목록 로드 실패: ' + e.message, 'error');
      }
    }

    function renderList(skills) {
      const el = document.getElementById('skillList');
      if (!skills.length) {
        el.innerHTML = '<div class="text-center py-12 text-gray-400"><i class="fas fa-inbox text-4xl mb-3"></i><p>저장된 스킬이 없습니다.</p></div>';
        return;
      }
      el.innerHTML = skills.map(s => \`
        <div class="glass rounded-xl p-4 shadow-sm border hover:shadow-md transition cursor-pointer" onclick="viewSkill(\${s.id})">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <p class="font-semibold text-gray-800">\${s.title}</p>
              <p class="text-gray-500 text-xs mt-1">
                <span class="mr-3"><i class="fas fa-folder-open mr-1"></i>\${s.topic || '-'}</span>
                <span class="mr-3"><i class="fas fa-file mr-1"></i>\${s.template_name || '-'}</span>
                <span><i class="fas fa-clock mr-1"></i>\${new Date(s.created_at).toLocaleDateString('ko-KR')}</span>
              </p>
              <div class="flex flex-wrap gap-1 mt-2">
                \${(s.tags || '').split(',').filter(Boolean).map(t => '<span class="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-xs">' + t.trim() + '</span>').join('')}
              </div>
            </div>
            <div class="flex gap-2 ml-4">
              <button onclick="event.stopPropagation(); deleteSkill(\${s.id})" class="text-red-400 hover:text-red-600 px-2 py-1 rounded text-sm">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      \`).join('');
    }

    function renderPagination(page, totalPages, total) {
      const el = document.getElementById('pagination');
      if (totalPages <= 1) { el.innerHTML = '<p class="text-gray-400 text-sm">총 ' + total + '건</p>'; return; }
      let html = '';
      for (let i = 1; i <= totalPages; i++) {
        html += '<button onclick="loadSkills(' + i + ')" class="px-3 py-1 rounded-lg text-sm ' +
          (i === page ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100') + '">' + i + '</button>';
      }
      html += '<span class="text-gray-400 text-sm ml-2">총 ' + total + '건</span>';
      el.innerHTML = html;
    }

    async function viewSkill(id) {
      try {
        const res = await fetch('/api/skills/' + id);
        const data = await res.json();
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
      const blob = new Blob([currentSkillMd], { type: 'text/markdown' });
      const a = document.createElement('a');
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

    // ESC로 모달 닫기
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

    // 초기 로드
    loadSkills();
  </script>
</body>
</html>`

export default app
