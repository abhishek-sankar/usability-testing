import { NextRequest, NextResponse } from 'next/server'
import { getDemoConfig } from '@/lib/demo-config'

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, userEvents, testUrl, context, walkthroughContext } = body

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY not configured' },
        { status: 500 }
      )
    }

    // Build system prompt with context about the usability test
    let domain = 'the website'
    try {
      if (testUrl) {
        domain = new URL(testUrl).hostname.replace('www.', '')
      }
    } catch (e) {
      // Invalid URL, use default
    }
    
    // Summarize recent user events for context
    const recentEvents = userEvents?.slice(-10) || []
    const eventSummary = recentEvents.length > 0
      ? `Recent user actions:\n${recentEvents.map((e: any) => `- ${e.type}: ${JSON.stringify(e.data || {})}`).join('\n')}`
      : 'No recent user actions.'

    let systemPrompt = `You are Ava, a friendly and empathetic UX research assistant conducting a usability test. You're helping a user test ${domain}.

Your role:
- Ask thoughtful, non-intrusive questions about their experience
- Wait for natural pauses before speaking (3-5 seconds after actions)
- Be curious and non-judgmental
- Keep responses concise (1-2 sentences)
- Focus on understanding their experience, not testing them

Context about the test:
${eventSummary}

Guidelines:
- If the user just performed an action (click, navigation, etc.), ask about their expectations or experience
- If they're speaking to you, respond naturally to what they said
- Don't ask too many questions in a row - let them explore
- Be conversational and warm, not robotic
- If they seem stuck or confused, offer gentle guidance



`

    let resolvedWalkthroughContext = walkthroughContext
    if (!resolvedWalkthroughContext && testUrl) {
      const demoConfig = getDemoConfig(testUrl)
      if (demoConfig?.walkthroughContext) {
        resolvedWalkthroughContext = demoConfig.walkthroughContext
      }
    }

    if (resolvedWalkthroughContext) {
      systemPrompt += `\n\nSite-specific context to reference:\n${resolvedWalkthroughContext}`
    }

    // Add additional context if provided (e.g., for automatic questions based on user actions)
    if (context) {
      systemPrompt += `\n\nAdditional context: ${context}`
    }

    // Build the context message explaining what's happening
    const latestEvent = userEvents && userEvents.length > 0 ? userEvents[userEvents.length - 1] : null
    const eventDescription = latestEvent 
      ? `The user just performed a ${latestEvent.type} action${latestEvent.data ? `: ${JSON.stringify(latestEvent.data)}` : ''}.`
      : 'The user is exploring the website.'
    
    // Create a user message that explains the context and asks what question to ask
    // Always end with: "As a usability testing agent for [domain], what should your ideal response be?"
    let contextMessage = `You are conducting a usability test for ${domain}. ${eventDescription}

The user is performing usability testing - they're exploring and interacting with the website while you observe and ask questions.

Recent user actions:
${eventSummary}

As a usability testing agent for ${domain}, what should your ideal response be?`

    if (resolvedWalkthroughContext) {
      contextMessage += `\n\nReference walkthrough details:\n${resolvedWalkthroughContext}`
    }

    // Prepare messages for OpenAI
    const openAIMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
    ]

    // Convert incoming messages from {speaker, text} format to OpenAI {role, content} format
    // OpenAI Chat Completions API expects: messages array with {role: 'system'|'user'|'assistant', content: string}
    if (messages.length > 0) {
      messages.forEach((msg: any) => {
        // Map speaker field to OpenAI role field
        // 'user' -> 'user', 'ai' -> 'assistant'
        let role: 'user' | 'assistant'
        if (msg.speaker === 'user') {
          role = 'user'
        } else if (msg.speaker === 'ai' || msg.speaker === 'assistant') {
          role = 'assistant'
        } else {
          // Default to assistant if speaker is not recognized
          console.warn('Unknown speaker:', msg.speaker, 'defaulting to assistant')
          role = 'assistant'
        }
        
        // Map text field to content field
        const content = msg.text || msg.content || ''
        
        if (!content) {
          console.warn('Empty message content, skipping:', msg)
          return
        }
        
        openAIMessages.push({
          role,
          content,
        })
      })
      // After existing conversation, add the context message asking what to ask next
      openAIMessages.push({
        role: 'user',
        content: contextMessage,
      })
    } else {
      // If no conversation yet, start with the context message
      openAIMessages.push({
        role: 'user',
        content: contextMessage,
      })
    }
    
    // Log the final message structure for debugging (truncated for readability)
    console.log('OpenAI messages structure:', JSON.stringify(
      openAIMessages.map(m => ({ 
        role: m.role, 
        content: m.content.length > 150 ? m.content.substring(0, 150) + '...' : m.content 
      })), 
      null, 
      2
    ))

    // Call OpenAI API (GPT-4o-mini for cost efficiency, can upgrade to GPT-4o-nano if available)
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-5', 
        messages: openAIMessages,
        // Note: gpt-5-nano only supports default temperature (1), cannot customize
        max_completion_tokens: 2000, // Keep responses concise (gpt-5-nano uses max_completion_tokens instead of max_tokens)
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('OpenAI API error:', error)
      return NextResponse.json(
        { error: 'Failed to generate response', details: error },
        { status: response.status }
      )
    }

    const result = await response.json()
    console.log('OpenAI API response:', JSON.stringify(result, null, 2))
    
    const assistantMessage = result.choices?.[0]?.message?.content || ''

    if (!assistantMessage) {
      console.error('No assistant message in response:', result)
      return NextResponse.json(
        { error: 'No response generated', details: result },
        { status: 500 }
      )
    }

    return NextResponse.json({ text: assistantMessage.trim() })
  } catch (error) {
    console.error('Chat route error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

