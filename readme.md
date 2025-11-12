# AI Usability Testing - MVP Prototype

A delightful MVP for conversational usability testing with AI. Built with Next.js, featuring a split-view interface where users interact with an app while an AI moderator (Ava) asks contextual questions.

## Features

- **Split-view interface**: App under test on the left, AI panel on the right
- **Voice interaction**: ElevenLabs TTS for natural-sounding AI responses
- **Smart event detection**: Automatically detects clicks, route changes, and user interactions
- **Contextual questions**: AI asks relevant questions based on user actions
- **Non-intrusive**: Waits 3-5 seconds after actions before speaking
- **Beautiful UI**: Polished animations, waveform indicators, and clean design
- **Privacy-first**: Consent modal and clear data usage explanation

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- ElevenLabs API key (optional for development - mock mode available)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your ElevenLabs API key:
```
ELEVENLABS_API_KEY=your_api_key_here
ELEVENLABS_VOICE_ID=your_voice_id_here  # Optional, defaults to a standard voice
NEXT_PUBLIC_TEST_APP_URL=https://example.com  # URL of app to test
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Quick Test

To test with the included demo app, set in your `.env.local`:
```
NEXT_PUBLIC_TEST_APP_URL=/demo-app.html
```

The demo app will be automatically served from the `/demo-app.html` route.

## How It Works

1. **Consent Modal**: User sees a friendly consent screen explaining what will be recorded
2. **App Frame**: Left side loads the app under test in an iframe with injected observer script
3. **Event Detection**: Observer script detects:
   - Route/navigation changes
   - Button/link clicks
   - Input field focus
   - Periods of inactivity
4. **AI Orchestration**: Backend receives events and generates contextual questions
5. **Voice Response**: Questions are converted to speech via ElevenLabs and played to user
6. **Transcript**: All conversation appears in the right panel with visual indicators

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── tts/          # ElevenLabs TTS endpoint
│   │   └── events/       # Event logging endpoint
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Main page with split view
│   └── globals.css       # Global styles
├── components/
│   ├── AppFrame.tsx      # Iframe with observer injection
│   ├── AIPanel.tsx       # Right panel with AI interaction
│   ├── ConsentModal.tsx  # Initial consent screen
│   ├── Transcript.tsx    # Conversation transcript display
│   └── WaveformAnimation.tsx  # Visual listening indicator
└── lib/
    ├── ai-orchestrator.ts  # Question generation logic
    └── session-context.tsx  # React context for session state
```

## Configuration

### Test App URL

Set `NEXT_PUBLIC_TEST_APP_URL` in your `.env` file to point to the app you want to test. 

**For quick testing**, you can use the included demo app:
```
NEXT_PUBLIC_TEST_APP_URL=/demo-app.html
```

Or test any external app:
```
NEXT_PUBLIC_TEST_APP_URL=https://example.com
```

### API Keys Setup

#### ElevenLabs (Required for Voice)
1. Sign up at [ElevenLabs](https://elevenlabs.io)
2. Get your API key from the dashboard
3. Optionally choose a voice ID (or use the default)
4. Add to `.env.local` file:
   ```
   ELEVENLABS_API_KEY=your_api_key_here
   ELEVENLABS_VOICE_ID=your_voice_id_here  # Optional
   ELEVENLABS_MODEL_ID=eleven_turbo_v2  # Optional, defaults to free tier compatible model
   ```

#### OpenAI (Required for Conversation)
1. Sign up at [OpenAI](https://platform.openai.com)
2. Get your API key from the API keys section
3. Add to `.env.local` file:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

**Note**: 
- The app uses GPT-4o-mini for conversation processing (cost-efficient)
- ElevenLabs uses `eleven_turbo_v2` by default, which is compatible with the free tier
- Without API keys, the app will run in mock mode (limited functionality)

## MVP Limitations

This is an MVP focused on feel over completeness:

- **No STT (Speech-to-Text)**: User responses aren't captured yet (transcript shows AI only)
- **Simple question logic**: Uses templates rather than advanced AI reasoning
- **No analytics storage**: Events are logged but not persisted
- **Basic error handling**: Graceful degradation but not production-ready

## Next Steps for Production

- [ ] Add Web Speech API or Whisper for STT
- [ ] Integrate with LLM (OpenAI/Anthropic) for smarter question generation
- [ ] Add database for session storage and analytics
- [ ] Implement session replay with event timeline
- [ ] Add export functionality for test results
- [ ] Improve cross-origin iframe handling
- [ ] Add more sophisticated inactivity detection

## Design Philosophy

> "You're not building a testing suite; you're building a conversation-in-context."

Every design decision prioritizes:
- **Feel over accuracy**: Latency matters more than perfect content matching
- **Non-intrusive**: AI waits for natural pauses
- **Human pacing**: Natural conversation flow, not rapid-fire questions
- **Visual polish**: Smooth animations and pleasant aesthetics
