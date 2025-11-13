'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { getDefaultTestUrl } from '@/lib/demo-config'

interface URLInputScreenProps {
  onContinue: (url: string) => void
}

export default function URLInputScreen({ onContinue }: URLInputScreenProps) {
  const [url, setUrl] = useState('https://scoot-tweak-89829545.figma.site/')

  useEffect(() => {
    const defaultUrl = getDefaultTestUrl()
    if (defaultUrl) {
      setUrl(defaultUrl)
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (url.trim()) {
      onContinue(url.trim())
    }
  }

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-background p-8">
      <Card className="w-full max-w-2xl p-8">
        <h1 className="text-3xl font-semibold mb-2">AI Usability Testing</h1>
        <p className="text-muted-foreground mb-8">
          Enter the URL of the website you'd like to test
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="url" className="text-sm font-medium">
              Website URL
            </label>
            <Input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://scoot-tweak-89829545.figma.site/"
              className="w-full"
            />
          </div>
          
          <Button type="submit" className="w-full" size="lg">
            Continue
          </Button>
        </form>
      </Card>
    </div>
  )
}

