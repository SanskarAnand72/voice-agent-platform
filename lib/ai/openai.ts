import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AIResponse {
  text: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

/**
 * Generate AI response using OpenAI GPT-4o with conversation history support
 */
export async function generateAIResponse(
  systemPrompt: string,
  userMessage: string,
  model = 'gpt-4o',
  temperature = 0.7,
  maxTokens = 200,
  conversationHistory: Message[] = [],
): Promise<AIResponse> {
  try {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user', content: userMessage },
    ]

    const completion = await openai.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    })

    const responseText = completion.choices[0]?.message?.content || 'I apologize, I could not generate a response.'

    return {
      text: responseText,
      usage: completion.usage
        ? {
            promptTokens: completion.usage.prompt_tokens,
            completionTokens: completion.usage.completion_tokens,
            totalTokens: completion.usage.total_tokens,
          }
        : undefined,
    }
  } catch (error) {
    console.error('OpenAI Error:', error)
    throw new Error('Failed to generate AI response')
  }
}

/**
 * Generate a short, voice-optimized response (for phone calls)
 */
export async function generateVoiceResponse(
  systemPrompt: string,
  userMessage: string,
  model = 'gpt-4o',
  temperature = 0.7,
  conversationHistory: Message[] = [],
): Promise<AIResponse> {
  const voiceSystemPrompt = `${systemPrompt}

IMPORTANT VOICE CALL GUIDELINES:
- Keep responses concise (2-3 sentences max) for natural phone conversation
- Do not use markdown, bullet points, or formatting
- Speak naturally as if in a phone conversation
- Ask one clear question at a time if you need information
- Be warm, professional, and helpful`

  return generateAIResponse(
    voiceSystemPrompt,
    userMessage,
    model,
    temperature,
    200,
    conversationHistory,
  )
}
