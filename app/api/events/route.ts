import { NextRequest, NextResponse } from 'next/server'

// Simple event logging endpoint
// In production, you'd want to store this in a database
export async function POST(request: NextRequest) {
  try {
    const event = await request.json()

    // Log event (in production, save to database)
    console.log('User event:', {
      type: event.type,
      timestamp: new Date(event.timestamp).toISOString(),
      data: event.data,
    })

    // You could also store in a file or database here
    // For MVP, just acknowledge receipt

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Event logging error:', error)
    return NextResponse.json(
      { error: 'Failed to log event' },
      { status: 500 }
    )
  }
}

