import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File

    if (!audioFile) {
      return NextResponse.json({ error: 'Audio file is required' }, { status: 400 })
    }

    const apiKey = process.env.ELEVENLABS_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'ELEVENLABS_API_KEY not configured' },
        { status: 500 }
      )
    }

    // Convert File to Buffer for ElevenLabs API
    const audioBuffer = await audioFile.arrayBuffer()

    // Create new FormData for ElevenLabs API
    const elevenLabsFormData = new FormData()
    elevenLabsFormData.append('file', new Blob([audioBuffer], { type: audioFile.type || 'audio/webm' }), 'audio.webm')
    elevenLabsFormData.append('model_id', 'scribe_v1') // Required: scribe_v1 or scribe_v1_experimental
    elevenLabsFormData.append('language_code', 'eng') // Optional: English (null for auto-detect)
    elevenLabsFormData.append('tag_audio_events', 'false') // Optional: tag events like laughter
    elevenLabsFormData.append('diarize', 'false') // Optional: speaker diarization

    // Call ElevenLabs Speech-to-Text API
    // Endpoint: POST /v1/speech-to-text
    const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
      },
      body: elevenLabsFormData,
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('ElevenLabs STT API error:', error)
      return NextResponse.json(
        { error: 'Speech-to-text conversion failed', details: error },
        { status: response.status }
      )
    }

    const result = await response.json()
    // ElevenLabs returns transcript with text field
    // Response format: { text: string, words: [...], language_code: string, ... }
    const transcriptText = result.text || ''
    
    if (!transcriptText) {
      console.warn('No text in STT response:', result)
    }
    
    return NextResponse.json({ text: transcriptText })
  } catch (error) {
    console.error('STT route error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

