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

# Knowledge Brief for Usability Testing — ChatGPT Trends

## Overview

**ChatGPT Trends** is a web-based data visualization platform that explores **what people are curious about through ChatGPT**.  
It aggregates anonymized and public-level data to identify **trending queries, categories, and regional interest patterns** in real time.  

The platform’s primary goal is to **make AI curiosity visible** — helping users understand:
- What topics people are asking about ChatGPT.
- Which use cases are emerging or declining.
- How interest varies across regions, time, and categories.

---

##  Core Goal

To build a **discovery layer for AI usage trends** — similar in spirit to Google Trends or Pinterest Trends, but focused on **ChatGPT interactions**.  
It bridges the gap between **AI discussions, search behavior, and market signals**, giving users a live snapshot of the world’s curiosity.

### Main Sections
1. **Home / Landing Page** — Overview, introduction, and entry point to exploration.
2. **Explore Trends** — Filtered browsing experience by category, region, and time.
3. **Trending Now** — Real-time trending queries in tabular format.
4. **Insights** — Deep-dive into a specific trend or topic.
5. **Global Dashboard** — Visual map of worldwide ChatGPT usage trends.

---

##  Landing Page

### Purpose
To introduce the platform’s intent — helping users explore global AI curiosity — and guide them toward discovering data interactively.

### Layout and Features
- **Top Navigation Bar:**
  - Left: *ChatGPT Trends* logo (clicking returns to homepage).
  - Right: Links to *Home*, *Explore*, *Trending*, *Insights*.
  - Optional “Sign In” or “Get Started” CTA.

- **Hero Section:**
  - Headline: “Discovering and exploring the world’s curiosity through real-time AI insights.”
  - Subtext: “Track trending topics, emerging patterns, and the questions millions of people are asking ChatGPT every day.”
  - Buttons: **Explore** and **View Insights** (primary and secondary CTAs).
  - Background: Animated gradient or subtle micro-interaction hinting at dynamism.

- **“What People Use ChatGPT For” Carousel:**
  - Displays top 5–6 use case categories (e.g., Creative Writing, Productivity, Learning & Education, Coding, Design, Entertainment).
  - Each card shows growth rate, top rising subtopics, and an “Explore” button.
  - Cards animate slightly on hover, signaling interactivity.

- **Quick Insights Section:**
  - Tiles summarizing trending themes (“AI Agents +42% this week”, “Learning Prompts +18%”).
  - Designed for *at-a-glance comprehension*.

- **Footer:**
  - Global navigation links, data source disclaimers, and links to related projects like “Made with ChatGPT Trends.”

---

##  Global Insights Dashboard

### Purpose
To visualize worldwide ChatGPT activity and emerging topic distribution.

### Components
- **Interactive World Map:**
  - Displays active regions (color intensity shows trend density).
  - Color codes:
    - 🟦 Blue = High activity  
    - 🟩 Green = Rising trend  
    - 🟪 Purple = Stable growth  
  - Hovering shows tooltip with top trending topics in that region.
  - Time filter toggles: Past hour / 24 hours / 7 days.

- **Top Regions + Categories Panel:**
  - Right-hand or below map.
  - Shows ranked list (e.g., 1. United States, 2. India, 3. UK…).
  - Each region card includes trend momentum and top category.

- **Scrolling Showcase:**
  - “How creators, researchers, and innovators are using ChatGPT.”
  - Shows real-world use cases across industries — education, design, healthcare, etc.

---

## Explore Trends Page

### Purpose
To allow deep, user-driven exploration through filters and search.

### Filters
- **Category:** All / AI & Tech / Education / Entertainment / Finance / Health / Society  
- **Time Range:** Past hour / Past week / Past 30 days  
- **Region:** Global / US / UK / Canada / Australia  
- **Trend Type:** Rising / Declining / Stable  

### Interactions
- Clicking filters updates cards dynamically (no reload).
- Sorting visually reorganizes cards using smooth transitions.

### Trend Cards
Each card contains:
- **Topic Title** (e.g., “AI Agents”)
- **Growth Percentage** (colored based on direction — green ↑, red ↓)
- **Category Label** (e.g., Tech)
- **Time Context** (e.g., “+32% past 7 days”)
- **Quick Insight Graph** — a small sparkline visualization.
- **CTA: “View Insights”** → Leads to deep-dive page.

---

## Trending Now Page

### Purpose
To present data-heavy users (analysts, researchers) with a live leaderboard of topics.

### Components
- **Real-Time Data Table:**
  - Columns: Rank | Topic | Volume | Δ Change (24h) | Trend Line
  - Animated graphs show trajectory.
- **Visual Indicators:**
  - Green = rising  
  - Red = declining  
  - Grey = stable
- **Export Function:** Option to download data for CSV or further research.

---

## Insights Page

### Purpose
To deliver a detailed understanding of a specific trend.

### Sections
1. **Header:**
   - Trend name, category, growth percentage, search count.
   - “Share” and “Explore Related” actions.

2. **Timeline Graph:**
   - X-axis: Time  
   - Y-axis: Search Volume  
   - View modes: 24h / 7d / 30d / 90d  

3. **Interest by Region:**
   - Horizontal bar graph showing where the topic is most active (e.g., 60% US, 20% UK, 10% India).

4. **Top Questions Asked:**
   - Sample user queries about this topic (e.g., “How do I fine-tune ChatGPT?”, “What are prompt chains?”).

5. **Related Topics:**
   - Algorithmically connected themes (e.g., “AI Assistants”, “Prompt Engineering”).

##  Typical User Flow

1. **Landing Page:** User lands and reads the hero headline → clicks “Explore.”
2. **Explore Page:** User filters by category and time → clicks “AI in Education.”
3. **Insights Page:** Sees interest by region → reads top questions.
4. **Global Dashboa**


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
