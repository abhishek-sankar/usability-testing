'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Mic, Send, X, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface VoiceInputProps {
  onMessage: (message: string) => void
  disabled?: boolean
  onRecordingChange?: (isRecording: boolean) => void
}

export default function VoiceInput({ onMessage, disabled, onRecordingChange }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [textInput, setTextInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  // Notify parent of recording state changes
  useEffect(() => {
    onRecordingChange?.(isRecording)
  }, [isRecording, onRecordingChange])

  const startRecording = async () => {
    try {
      setError(null)
      setTranscript('')
      audioChunksRef.current = []

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus', // Better browser support
      })

      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())

        // Process audio
        if (audioChunksRef.current.length > 0) {
          setIsProcessing(true)
          try {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
            await sendToSTT(audioBlob)
          } catch (err: any) {
            console.error('Error processing audio:', err)
            setError(`Failed to process audio: ${err.message}`)
          } finally {
            setIsProcessing(false)
            audioChunksRef.current = []
          }
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (err: any) {
      console.error('Error starting recording:', err)
      if (err.name === 'NotAllowedError') {
        setError('Microphone permission denied. Please allow microphone access.')
      } else {
        setError(`Failed to start recording: ${err.message}`)
      }
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const sendToSTT = async (audioBlob: Blob) => {
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')

      const response = await fetch('/api/stt', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to convert speech to text')
      }

      const result = await response.json()
      if (result.text) {
        setTranscript(result.text)
        onMessage(result.text)
      } else {
        setError('No transcript received. Please try again.')
      }
    } catch (err: any) {
      console.error('STT API error:', err)
      setError(`Speech recognition failed: ${err.message}`)
    }
  }

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (textInput.trim()) {
      onMessage(textInput.trim())
      setTextInput('')
    }
  }

  const dismissError = () => {
    setError(null)
  }

  return (
    <div className="space-y-4">
      {/* Voice Input */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={isRecording ? 'destructive' : 'outline'}
            size="lg"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={disabled || isProcessing}
            className="flex-1"
          >
            <Mic className="w-4 h-4 mr-2" />
            {isRecording ? 'Stop Recording' : isProcessing ? 'Processing...' : 'Start Voice Input'}
          </Button>
        </div>

        {/* Error message */}
        {error && (
          <Card className="p-3 bg-muted border-border">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-2">
                  {error}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={dismissError}
                  className="text-xs h-7 px-2"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Recording indicator */}
        {isRecording && !error && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            Recording... Speak now
          </div>
        )}

        {/* Processing indicator */}
        {isProcessing && (
          <div className="text-sm text-muted-foreground">
            Processing audio...
          </div>
        )}
      </div>

      {/* Text Input */}
      <form onSubmit={handleTextSubmit} className="flex gap-2">
        <Input
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder="Or type your response..."
          disabled={disabled}
          className="flex-1"
        />
        <Button type="submit" disabled={disabled || !textInput.trim()}>
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  )
}
