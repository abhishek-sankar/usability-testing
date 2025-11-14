// AI Orchestrator - Handles question generation and TTS

interface UserEvent {
  type: string
  data?: any
  timestamp: number
  elapsedTime: number
}

// Question templates based on event types
const questionTemplates = {
  route_change: [
    "What were you expecting to see when you navigated here?",
    "Does this page match what you were looking for?",
    "What do you think you can do on this page?",
  ],
  click: [
    "What did you expect would happen when you clicked that?",
    "Was that button where you expected to find it?",
    "What are you trying to accomplish here?",
  ],
  input_focus: [
    "What information are you looking to enter here?",
    "Is this field clear about what it's asking for?",
  ],
  page_load: [
    "What's your first impression of this page?",
    "What would you like to do first?",
  ],
  inactivity: [
    "What are you thinking about right now?",
    "Is there something unclear on this page?",
  ],
}

let questionIndex = 0

export async function generateQuestion(
  latestEvent: UserEvent,
  allEvents: UserEvent[]
): Promise<string | null> {
  console.log('🤔 Generating question for event type:', latestEvent.type)
  console.log('🤔 All events:', allEvents.length)
  
  // Count how many questions we've asked (by counting 'question_asked' events)
  // For now, let's be more lenient - allow up to 10 questions
  const questionCount = allEvents.filter((e) => e.type === 'question_asked').length
  console.log('🤔 Question count so far:', questionCount)
  
  if (questionCount >= 10) {
    console.log('🤔 Question limit reached')
    return null
  }

  // Get appropriate question template
  const eventType = latestEvent.type as keyof typeof questionTemplates
  const templates = questionTemplates[eventType] || questionTemplates.click
  
  console.log('🤔 Using templates for:', eventType, 'Available:', templates.length)

  // Rotate through templates
  const question = templates[questionIndex % templates.length]
  questionIndex++
  
  console.log('🤔 Generated question:', question)

  // Add small delay to prevent rapid-fire questions
  await new Promise((resolve) => setTimeout(resolve, 500))

  return question
}

// Store current audio element for mute control
let currentAudio: HTMLAudioElement | null = null

export async function speakText(
  text: string,
  onComplete: () => void,
  isMuted: boolean = false
): Promise<void> {
  try {
    // If muted, skip audio playback but still call onComplete
    if (isMuted) {
      setTimeout(onComplete, text.length * 50) // Rough estimate: 50ms per character
      return
    }

    // Stop any currently playing audio
    if (currentAudio) {
      currentAudio.pause()
      currentAudio = null
    }

    // Call API route for TTS
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    })

    if (!response.ok) {
      throw new Error('TTS request failed')
    }

    // Get audio blob and play it
    const audioBlob = await response.blob()
    const audioUrl = URL.createObjectURL(audioBlob)
    const audio = new Audio(audioUrl)
    currentAudio = audio

    audio.onended = () => {
      URL.revokeObjectURL(audioUrl)
      currentAudio = null
      onComplete()
    }

    audio.onerror = () => {
      URL.revokeObjectURL(audioUrl)
      currentAudio = null
      onComplete()
    }

    await audio.play()
  } catch (error) {
    console.error('Error in speakText:', error)
    currentAudio = null
    // Fallback: just call onComplete after a delay
    setTimeout(onComplete, text.length * 50) // Rough estimate: 50ms per character
  }
}

export function stopAudio(): void {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio = null
  }
}

