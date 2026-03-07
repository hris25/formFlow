import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

// ─── Types ─────────────────────────────────────────────────

export interface GlobalInsights {
  summary: string
  strengths: string[]
  weaknesses: string[]
  suggestions: string[]
  openAnswersSummary?: {
    questionLabel: string
    themes: { theme: string; count: number; examples: string[] }[]
    globalSentiment: 'positif' | 'neutre' | 'négatif' | 'mitigé'
  }[]
}

export interface QuestionInsights {
  questionLabel: string
  totalAnswers: number
  themes: { theme: string; count: number; examples: string[] }[]
  globalSentiment: 'positif' | 'neutre' | 'négatif' | 'mitigé'
  suggestion: string
  // Prêt pour un diagramme — regroupement des réponses similaires
  chart: { label: string; count: number; percentage: number }[]
}

// ─── Helper prompt ─────────────────────────────────────────

const askGroq = async (prompt: string): Promise<string> => {
  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: `Tu es un assistant pédagogique expert. Tu analyses les réponses d'élèves et fournis des insights utiles aux professeurs. Tu réponds UNIQUEMENT en JSON valide, sans markdown, sans texte avant ou après.`,
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.3,
    max_tokens: 2000,
  })
  return response.choices[0].message.content ?? ''
}

const safeParseJSON = (text: string) => {
  try {
    return JSON.parse(text.replace(/```json|```/g, '').trim())
  } catch {
    return null
  }
}

// ─── Analyse globale d'un formulaire ───────────────────────

export const analyzeForm = async (form: {
  title: string
  questions: { id: string; label: string; type: string }[]
  responses: { answers: { questionId: string; value: string }[] }[]
}): Promise<GlobalInsights> => {

  // Construit un résumé lisible pour l'IA
  const summary = form.questions.map(q => {
    const answers = form.responses
      .flatMap(r => r.answers)
      .filter(a => a.questionId === q.id)
      .map(a => JSON.parse(a.value))

    if (q.type === 'open') {
      return `Question (texte libre): "${q.label}"\nRéponses: ${answers.map(a => `"${a}"`).join(', ')}`
    }
    if (q.type === 'yes_no') {
      const yes = answers.filter(a => ['true', 'yes', 'oui', '1'].includes(String(a).toLowerCase())).length
      const no = answers.length - yes
      return `Question (oui/non): "${q.label}"\nOui: ${yes}, Non: ${no}`
    }
    if (q.type === 'rating') {
      const nums = answers.map(Number).filter(n => !isNaN(n))
      const avg = nums.length > 0 ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1) : 'N/A'
      return `Question (note): "${q.label}"\nMoyenne: ${avg}/5, Réponses: ${answers.join(', ')}`
    }
    // multiple_choice
    const dist: Record<string, number> = {}
    answers.flat().forEach((v: string) => { dist[v] = (dist[v] || 0) + 1 })
    return `Question (choix multiple): "${q.label}"\nDistribution: ${Object.entries(dist).map(([k, v]) => `${k}: ${v}`).join(', ')}`
  }).join('\n\n')

  const prompt = `
Voici les résultats d'un formulaire intitulé "${form.title}" rempli par ${form.responses.length} élèves.

${summary}

Analyse ces résultats et réponds avec ce JSON exact :
{
  "summary": "résumé global en 2-3 phrases",
  "strengths": ["point fort 1", "point fort 2"],
  "weaknesses": ["point faible 1", "point faible 2"],
  "suggestions": ["suggestion concrète 1", "suggestion concrète 2", "suggestion concrète 3"],
  "openAnswersSummary": [
    {
      "questionLabel": "label de la question ouverte",
      "themes": [
        { "theme": "nom du thème", "count": 5, "examples": ["exemple 1", "exemple 2"] }
      ],
      "globalSentiment": "positif|neutre|négatif|mitigé"
    }
  ]
}
`
  const raw = await askGroq(prompt)
  const parsed = safeParseJSON(raw)

  if (!parsed) return {
    summary: 'Analyse indisponible',
    strengths: [],
    weaknesses: [],
    suggestions: [],
  }

  return parsed
}

// ─── Analyse d'une question ouverte ────────────────────────

export const analyzeOpenQuestion = async (
  questionLabel: string,
  answers: string[]
): Promise<QuestionInsights> => {

  const prompt = `
Voici les réponses de ${answers.length} élèves à la question ouverte : "${questionLabel}"

Réponses :
${answers.map((a, i) => `${i + 1}. "${a}"`).join('\n')}

Analyse ces réponses et réponds avec ce JSON exact :
{
  "questionLabel": "${questionLabel}",
  "totalAnswers": ${answers.length},
  "themes": [
    {
      "theme": "nom du thème regroupant des réponses similaires",
      "count": 5,
      "examples": ["réponse exemple 1", "réponse exemple 2"]
    }
  ],
  "globalSentiment": "positif|neutre|négatif|mitigé",
  "suggestion": "suggestion concrète pour le professeur basée sur ces réponses",
  "chart": [
    { "label": "nom du thème", "count": 5, "percentage": 25.0 }
  ]
}

Important: le champ "chart" doit reprendre les mêmes thèmes que "themes" pour pouvoir afficher un diagramme.
`
  const raw = await askGroq(prompt)
  const parsed = safeParseJSON(raw)

  if (!parsed) return {
    questionLabel,
    totalAnswers: answers.length,
    themes: [],
    globalSentiment: 'neutre',
    suggestion: 'Analyse indisponible',
    chart: [],
  }
  
  return parsed
}