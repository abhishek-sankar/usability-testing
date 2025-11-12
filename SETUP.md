# Quick Setup Guide

## 1. Install Dependencies

```bash
npm install
```

## 2. Create Environment File

Create a `.env.local` file in the root directory:

```bash
# Copy this template and fill in your values
ELEVENLABS_API_KEY=your_api_key_here  # Required for TTS and STT
OPENAI_API_KEY=your_openai_api_key_here  # Required for GPT-4o-mini conversation processing
ELEVENLABS_VOICE_ID=your_voice_id_here  # Optional, defaults to a standard voice
ELEVENLABS_MODEL_ID=eleven_turbo_v2  # Optional, defaults to eleven_turbo_v2 (free tier compatible)
NEXT_PUBLIC_TEST_APP_URL=/demo-app.html
```

**Note**: If you don't have an ElevenLabs API key, the app will run in mock mode (no voice, but everything else works).

## 3. Run Development Server

```bash
npm run dev
```

## 4. Test It Out

1. Open http://localhost:3000
2. Click "I understand, let's begin" on the consent modal
3. Interact with the demo app on the left
4. Watch Ava ask contextual questions on the right!

## Testing Without ElevenLabs

The app works perfectly fine without an API key - it just won't have voice output. You'll still see:
- ✅ Event detection
- ✅ Question generation
- ✅ Transcript display
- ✅ All UI animations
- ❌ No audio playback (silent mode)

## Getting an ElevenLabs API Key (Optional)

1. Sign up at https://elevenlabs.io
2. Go to your profile → API Key
3. Copy your API key
4. Add it to `.env.local`

That's it! 🎉

