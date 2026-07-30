import { createGroq } from "@ai-sdk/groq"
import { generateText, streamText } from "ai"

function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    throw new Error("Missing GROQ_API_KEY environment variable.")
  }
  return createGroq({ apiKey })
}

export interface AIResponse {
  text: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export async function generateAIResponse(
  systemPrompt: string,
  userMessage: string,
  model = "llama-3.1-70b-versatile",
  temperature = 0.7,
  maxTokens = 1000,
): Promise<AIResponse> {
  try {
    const groq = getGroqClient()
    const result = await generateText({
      model: groq(model),
      system: systemPrompt,
      prompt: userMessage,
      temperature,
      maxOutputTokens: maxTokens,
    })

    return {
      text: result.text,
      usage: result.usage
        ? {
            promptTokens: result.usage.inputTokens ?? 0,
            completionTokens: result.usage.outputTokens ?? 0,
            totalTokens: (result.usage.inputTokens ?? 0) + (result.usage.outputTokens ?? 0),
          }
        : undefined,
    }
  } catch (error) {
    console.error("Groq AI Error:", error)
    throw error instanceof Error ? error : new Error("Failed to generate AI response")
  }
}

export async function streamAIResponse(
  systemPrompt: string,
  userMessage: string,
  model = "llama-3.1-70b-versatile",
  temperature = 0.7,
  maxTokens = 1000,
) {
  try {
    const groq = getGroqClient()
    const result = streamText({
      model: groq(model),
      system: systemPrompt,
      prompt: userMessage,
      temperature,
      maxOutputTokens: maxTokens,
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error("Groq AI Streaming Error:", error)
    throw new Error("Failed to stream AI response")
  }
}
