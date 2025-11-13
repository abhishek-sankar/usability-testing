'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { getCustomConfig, getDefaultConfig, saveCustomConfig, resetCustomConfig, getDefaultTestUrl, saveDefaultTestUrl } from '@/lib/demo-config'
import Link from 'next/link'

export default function ConfigPage() {
  const [introScript, setIntroScript] = useState('')
  const [walkthroughContext, setWalkthroughContext] = useState('')
  const [defaultTestUrl, setDefaultTestUrl] = useState('')
  const [hasCustomConfig, setHasCustomConfig] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    // Load current config (custom or default)
    const customConfig = getCustomConfig()
    const defaultConfig = getDefaultConfig()
    const savedUrl = getDefaultTestUrl()
    
    if (customConfig) {
      setIntroScript(customConfig.introScript)
      setWalkthroughContext(customConfig.walkthroughContext)
      setHasCustomConfig(true)
    } else {
      setIntroScript(defaultConfig.introScript)
      setWalkthroughContext(defaultConfig.walkthroughContext)
      setHasCustomConfig(false)
    }
    
    setDefaultTestUrl(savedUrl || '')
  }, [])

  const handleSave = () => {
    saveCustomConfig({
      introScript,
      walkthroughContext,
      hostnames: [], // No longer used, but keep for compatibility
    })
    saveDefaultTestUrl(defaultTestUrl)
    setHasCustomConfig(true)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleReset = () => {
    const defaultConfig = getDefaultConfig()
    setIntroScript(defaultConfig.introScript)
    setWalkthroughContext(defaultConfig.walkthroughContext)
    resetCustomConfig()
    setHasCustomConfig(false)
    setSaved(false)
  }

  return (
    <div className="fixed inset-0 overflow-y-auto bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-6 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Configuration</h1>
            <p className="text-muted-foreground mt-2">
              Customize the ChatGPT prompts used for usability testing
            </p>
          </div>
          <Link href="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>

        {/* Status Banner */}
        {hasCustomConfig && (
          <Card className="border-blue-500 bg-blue-50 dark:bg-blue-950">
            <CardContent className="pt-6">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                ⚙️ Using custom configuration. Changes will be applied to new test sessions.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Default Test URL */}
        <Card>
          <CardHeader>
            <CardTitle>Default Test URL</CardTitle>
            <CardDescription>
              The default website URL that will be loaded in the embedded iframe when starting a new test session. Leave empty to show URL input screen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              value={defaultTestUrl}
              onChange={(e) => setDefaultTestUrl(e.target.value)}
              placeholder="https://example.com"
              className="font-mono text-sm"
            />
          </CardContent>
        </Card>

        {/* Intro Script */}
        <Card>
          <CardHeader>
            <CardTitle>Intro Script</CardTitle>
            <CardDescription>
              The initial message Ava will say to participants when they start the test session.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={introScript}
              onChange={(e) => setIntroScript(e.target.value)}
              className="min-h-[120px] font-mono text-sm"
              placeholder="Enter the intro script..."
            />
          </CardContent>
        </Card>

        {/* Walkthrough Context */}
        <Card>
          <CardHeader>
            <CardTitle>Walkthrough Context</CardTitle>
            <CardDescription>
              Detailed context about the website being tested. This helps Ava ask more relevant questions during the session.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={walkthroughContext}
              onChange={(e) => setWalkthroughContext(e.target.value)}
              className="min-h-[400px] font-mono text-sm"
              placeholder="Enter the walkthrough context..."
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardFooter className="flex flex-row justify-between items-center gap-4">
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={saved}
              >
                {saved ? '✓ Saved!' : 'Save Configuration'}
              </Button>
              {hasCustomConfig && (
                <Button
                  onClick={handleReset}
                  variant="outline"
                >
                  Reset to Default
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground whitespace-nowrap">
              Changes are saved to browser localStorage
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

