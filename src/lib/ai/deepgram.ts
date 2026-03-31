/**
 * DEEPGRAM TRANSCRIPTION CLIENT
 *
 * Real-time streaming transcription for:
 * - Human-Led Mock Mode (companion device mic → question detection)
 * - Live Workspace (device mic → question detection for teleprompter)
 *
 * Demo mode: falls back to browser Web Speech API.
 * Production: Deepgram Nova-3 via WebSocket streaming.
 *
 * NOTE: This module is client-side only (browser environment).
 */

import { getDemoFlags } from '@/lib/demo/flags'

export interface TranscriptChunk {
  text: string
  is_final: boolean
  confidence: number
  speaker?: number
}

export interface DeepgramConfig {
  onTranscript: (chunk: TranscriptChunk) => void
  onQuestion: (text: string) => void
  onError: (error: Error) => void
  language?: string
}

// Heuristic: a chunk is likely a question if it ends with '?' or
// contains common question-opening words
function isLikelyQuestion(text: string): boolean {
  const trimmed = text.trim()
  if (trimmed.endsWith('?')) return true
  const questionStarters =
    /^(what|how|why|when|where|who|which|can you|could you|tell me|describe|walk me|give me|talk me)/i
  return questionStarters.test(trimmed)
}

/** Browser Web Speech API fallback for demo / no-key mode */
export class WebSpeechTranscriber {
  private recognition: SpeechRecognition | null = null
  private config: DeepgramConfig
  private running = false

  constructor(config: DeepgramConfig) {
    this.config = config
  }

  start() {
    if (this.running) return
    const SR =
      window.SpeechRecognition || (window as unknown as { webkitSpeechRecognition: typeof SpeechRecognition }).webkitSpeechRecognition
    if (!SR) {
      this.config.onError(new Error('Speech recognition not supported in this browser.'))
      return
    }

    this.recognition = new SR()
    this.recognition.continuous = true
    this.recognition.interimResults = true
    this.recognition.lang = this.config.language ?? 'en-GB'

    this.recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const text = result[0].transcript
        const is_final = result.isFinal

        this.config.onTranscript({
          text,
          is_final,
          confidence: result[0].confidence ?? 0.9,
        })

        if (is_final && isLikelyQuestion(text)) {
          this.config.onQuestion(text.trim())
        }
      }
    }

    this.recognition.onerror = (event) => {
      this.config.onError(new Error(`Speech recognition error: ${event.error}`))
    }

    this.recognition.start()
    this.running = true
  }

  stop() {
    this.recognition?.stop()
    this.running = false
  }
}

/** Deepgram streaming transcriber */
export class DeepgramTranscriber {
  private socket: WebSocket | null = null
  private mediaRecorder: MediaRecorder | null = null
  private config: DeepgramConfig
  private running = false

  constructor(config: DeepgramConfig) {
    this.config = config
  }

  async start() {
    if (this.running) return

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

    const params = new URLSearchParams({
      model: 'nova-3',
      language: this.config.language ?? 'en-GB',
      smart_format: 'true',
      punctuate: 'true',
      diarize: 'true',
      utterances: 'true',
      vad_events: 'true',
      encoding: 'linear16',
      sample_rate: '16000',
    })

    this.socket = new WebSocket(
      `wss://api.deepgram.com/v1/listen?${params}`,
      ['token', process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY ?? ''],
    )

    this.socket.onopen = () => {
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      })

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && this.socket?.readyState === WebSocket.OPEN) {
          this.socket.send(event.data)
        }
      }

      this.mediaRecorder.start(250) // send chunks every 250ms
    }

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data)

      if (data.type === 'Results') {
        const alt = data.channel?.alternatives?.[0]
        if (!alt) return

        const text: string = alt.transcript
        const is_final: boolean = data.is_final
        const confidence: number = alt.confidence ?? 0

        if (!text.trim()) return

        this.config.onTranscript({ text, is_final, confidence })

        if (is_final && isLikelyQuestion(text)) {
          this.config.onQuestion(text.trim())
        }
      }
    }

    this.socket.onerror = () => {
      this.config.onError(new Error('Deepgram WebSocket error'))
    }

    this.running = true
  }

  stop() {
    this.mediaRecorder?.stop()
    this.socket?.close()
    this.running = false
  }
}

/** Factory — returns the right transcriber based on demo flags */
export function createTranscriber(config: DeepgramConfig): WebSpeechTranscriber | DeepgramTranscriber {
  const flags = getDemoFlags()
  return flags.transcription
    ? new WebSpeechTranscriber(config)
    : new DeepgramTranscriber(config)
}
