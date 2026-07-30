export interface DeepgramTranscriptionOptions {
  audio: ArrayBuffer | Blob
  model?: string
  language?: string
  punctuate?: boolean
  diarize?: boolean
  smart_format?: boolean
}

export interface DeepgramTranscriptionResult {
  transcript: string
  confidence: number
  words?: Array<{
    word: string
    start: number
    end: number
    confidence: number
  }>
}

export class DeepgramService {
  private customApiKey?: string
  private baseUrl = "https://api.deepgram.com/v1"

  constructor(apiKey?: string) {
    this.customApiKey = apiKey
  }

  private getApiKey(): string {
    const key = this.customApiKey || process.env.DEEPGRAM_API_KEY
    if (!key) {
      throw new Error("Missing DEEPGRAM_API_KEY environment variable.")
    }
    return key
  }

  async transcribeAudio(options: DeepgramTranscriptionOptions): Promise<DeepgramTranscriptionResult> {
    try {
      const apiKey = this.getApiKey()
      const formData = new FormData()
      formData.append("audio", new Blob([options.audio]))

      const params = new URLSearchParams({
        model: options.model || "nova-2",
        language: options.language || "en-US",
        punctuate: options.punctuate ? "true" : "false",
        diarize: options.diarize ? "true" : "false",
        smart_format: options.smart_format ? "true" : "false",
      })

      const response = await fetch(`${this.baseUrl}/listen?${params}`, {
        method: "POST",
        headers: {
          Authorization: `Token ${apiKey}`,
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Deepgram API error: ${response.statusText}`)
      }

      const data = await response.json()
      const channel = data.results?.channels?.[0]
      const alternative = channel?.alternatives?.[0]

      if (!alternative) {
        throw new Error("No transcription results found")
      }

      return {
        transcript: alternative.transcript,
        confidence: alternative.confidence,
        words: alternative.words,
      }
    } catch (error) {
      console.error("Deepgram Transcription Error:", error)
      throw error instanceof Error ? error : new Error("Failed to transcribe audio")
    }
  }
}
