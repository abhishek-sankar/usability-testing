export interface DemoConfig {
  introScript: string
  walkthroughContext: string
}

const CHATGPT_TRENDS_HOSTNAMES = [
  'scoot-tweak-89829545.figma.site',
]

const CHATGPT_TRENDS_WALKTHROUGH = `You are guiding a usability walkthrough of the ChatGPT Trends concept site.
The page is structured as a marketing/insights hub with these notable sections:
- Hero headline "Discovering and exploring the world's curiosity" with CTAs "Explore Trends" and "View Insights".
- "Real-time Use Cases" grid that lists categories like Creative Writing, Productivity, Learning & Education, Coding, Design, and Entertainment. Each card shows emoji, top prompt, and growth percentages plus "View Insights" buttons.
- "Quick Insights" strip of cards that highlight topics such as Technology (+450% AI agents), Environment (+320% climate solutions), etc. Each card mentions 7-day trend momentum labels like Rising Fast.
- "Global AI Pulse Dashboard" featuring time-range toggles (Past hour / 24 hours / 7 days), a regional map, top-region stats (North America, Europe, Asia Pacific, South America, Africa) and "Rising Categories" chips for Technology, Environment, Science, Education.
- "Trending Categories" and "Made with ChatGPT Trends" sections that describe how creators use the data with cards titled "The Shape of Dreams", "Trending Now where you are", etc.

Use this knowledge to ask precise usability questions when the participant hovers, clicks, or navigates. Encourage them to explain expectations for CTAs (e.g., Explore Trends, View Insights, View All Insights, Visit) and dashboards, how they interpret growth percentages, and whether the layout makes it easy to compare regions or categories.`

const CHATGPT_TRENDS_INTRO = `Hi! I'm Ava, your UX research partner. We'll explore the ChatGPT Trends concept site together — it's a single-page walkthrough that showcases trending prompts, quick insight cards, the Global AI Pulse dashboard, and creator spotlights.
Feel free to click primary buttons like "Explore Trends", skim the Real-time Use Cases grid, and interact with any insight cards that catch your eye. After each action I'll follow up with short questions such as what you expected or what you hoped to learn.
Ready to start exploring ChatGPT Trends?`

function matchesChatGPTTrends(url?: string) {
  if (!url) return false
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`)
    return CHATGPT_TRENDS_HOSTNAMES.some((host) => parsed.hostname.includes(host))
  } catch (error) {
    return CHATGPT_TRENDS_HOSTNAMES.some((host) => url.includes(host))
  }
}

export function getDemoConfig(url?: string): DemoConfig | null {
  if (!matchesChatGPTTrends(url)) {
    return null
  }

  return {
    introScript: CHATGPT_TRENDS_INTRO,
    walkthroughContext: CHATGPT_TRENDS_WALKTHROUGH,
  }
}
