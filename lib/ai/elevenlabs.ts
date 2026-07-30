export interface ElevenLabsVoice {
  voice_id: string
  name: string
  category: string
}

export interface TextToSpeechOptions {
  text: string
  voice_id: string
  model_id?: string
  voice_settings?: {
    stability: number
    similarity_boost: number
    style?: number
    use_speaker_boost?: boolean
  }
}

export class ElevenLabsService {
  private customApiKey?: string
  private baseUrl = "https://api.elevenlabs.io/v1"

  constructor(apiKey?: string) {
    this.customApiKey = apiKey
  }

  private getApiKey(): string {
    const key = this.customApiKey || process.env.ELEVENLABS_API_KEY
    if (!key) {
      throw new Error("Missing ELEVENLABS_API_KEY environment variable.")
    }
    return key
  }

  async getVoices(): Promise<ElevenLabsVoice[]> {
    try {
      const apiKey = this.getApiKey()
      const response = await fetch(`${this.baseUrl}/voices`, {
        headers: {
          "xi-api-key": apiKey,
        },
      })

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data.voices
    } catch (error) {
      console.error("ElevenLabs Get Voices Error:", error)
      throw error instanceof Error ? error : new Error("Failed to fetch voices")
    }
  }

  async textToSpeech(options: TextToSpeechOptions): Promise<ArrayBuffer> {
    try {
      const apiKey = this.getApiKey()
      const response = await fetch(`${this.baseUrl}/text-to-speech/${options.voice_id}`, {
        method: "POST",
        headers: {
          Accept: "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
        },
        body: JSON.stringify({
          text: options.text,
          model_id: options.model_id || "eleven_monolingual_v1",
          voice_settings: options.voice_settings || {
            stability: 0.5,
            similarity_boost: 0.5,
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`ElevenLabs TTS error: ${response.statusText}`)
      }

      return await response.arrayBuffer()
    } catch (error) {
      console.error("ElevenLabs TTS Error:", error)
      throw error instanceof Error ? error : new Error("Failed to generate speech")
    }
  }
}
