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
  private apiKey: string
  private baseUrl = "https://api.deepgram.com/v1"

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.DEEPGRAM_API_KEY!
    if (!this.apiKey) {
      throw new Error("Deepgram API key is required")
    }
  }

  async transcribeAudio(options: DeepgramTranscriptionOptions): Promise<DeepgramTranscriptionResult> {
    try {
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
          Authorization: `Token ${this.apiKey}`,
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
      throw new Error("Failed to transcribe audio")
    }
  }
}
