import { Router } from 'express'
import OpenAI from 'openai'
import { verifyFirebaseToken } from '../middlewares/auth'

const router = Router()
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

/* helper – convert history[] sent from UI */
function normaliseHistory(raw: any[]): OpenAI.ChatCompletionMessageParam[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter(r => r && typeof r.text === 'string' && r.text.trim())
    .map(r => ({
      role: r.role === 'assistant' ? 'assistant' : 'user',
      content: r.text.trim()
    }))
}

router.post('/chat', verifyFirebaseToken, async (req, res) => {
  try {
    const { context, question, history = [] } = req.body

    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({ error: 'question is required' })
    }

    if (!context || typeof context !== 'object') {
      return res.status(400).json({ error: 'context is required' })
    }

    /* ---------- build prompt ---------- */
    const systemPrompt = `
You are an agronomist giving region-specific crop advice.
Soil: ${context.soilType}. Location: ${context.location}.
Season: ${context.season}. Water: ${context.availableWater}.
Goal: ${context.cropGoal || 'No specific goal'}.
Answer concisely in bullet-points where helpful.
`.trim()

    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...normaliseHistory(history),
      { role: 'user', content: question.trim() }
    ]

    /* ---------- call OpenAI ---------- */
    const resp = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: 600
    })

    return res.json({
      success: true,
      message: resp.choices[0].message?.content ?? ''
    })
  } catch (err: any) {
    console.error('[AI ERROR]', err)
    res
      .status(err?.status ?? 500)
      .json({ error: err?.message || 'AI service failed' })
  }
})

export default router