'use client'

import { useEffect, useRef, useState } from 'react'
import { useSessionContext } from '@/lib/session-context'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

interface AppFrameProps {
  testAppUrl: string
}

export default function AppFrame({ testAppUrl }: AppFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const { sessionActive, setUserEvents, sessionStartTime } = useSessionContext()
  const [iframeError, setIframeError] = useState(false)
  const [useProxy, setUseProxy] = useState(false)

  useEffect(() => {
    if (!sessionActive || !iframeRef.current) return

    const iframe = iframeRef.current
    let lastUrl = ''
    let lastActionTime = Date.now()
    let inactivityTimer: NodeJS.Timeout | null = null

    const sendEvent = (event: { type: string; data?: any }) => {
      const elapsedTime = sessionStartTime ? Date.now() - sessionStartTime : 0
      const eventWithMetadata = {
        ...event,
        timestamp: Date.now(),
        elapsedTime,
      }
      console.log('📊 Event captured:', eventWithMetadata)
      setUserEvents((prev) => {
        const updated = [...prev, eventWithMetadata]
        console.log('📊 Total events:', updated.length)
        return updated
      })
      lastActionTime = Date.now()
    }

    const checkRouteChange = () => {
      try {
        const iframeWindow = iframe.contentWindow
        if (!iframeWindow) return

        const currentUrl = iframeWindow.location.href
        if (currentUrl !== lastUrl && lastUrl !== '') {
          sendEvent({
            type: 'route_change',
            data: { from: lastUrl, to: currentUrl },
          })
        }
        lastUrl = currentUrl
      } catch (e) {
        // Cross-origin restrictions - use postMessage instead
      }
    }

    // Inject observer script into iframe
    const injectObserver = () => {
      try {
        const iframeWindow = iframe.contentWindow
        const iframeDoc = iframe.contentDocument || iframeWindow?.document

        if (!iframeDoc) return

        const script = iframeDoc.createElement('script')
        script.textContent = `
          (function() {
            let lastUrl = window.location.href;
            
            // Track route changes
            const observer = new MutationObserver(() => {
              if (window.location.href !== lastUrl) {
                window.parent.postMessage({
                  type: 'route_change',
                  data: { from: lastUrl, to: window.location.href }
                }, '*');
                lastUrl = window.location.href;
              }
            });
            
            observer.observe(document.body, { childList: true, subtree: true });
            
            // Track clicks
            document.addEventListener('click', (e) => {
              const target = e.target;
              const text = target.textContent?.trim() || '';
              const tag = target.tagName.toLowerCase();
              
              window.parent.postMessage({
                type: 'click',
                data: {
                  tag,
                  text: text.substring(0, 50),
                  id: target.id || '',
                  className: target.className || ''
                }
              }, '*');
            }, true);
            
            // Track focus on inputs
            document.addEventListener('focus', (e) => {
              if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                window.parent.postMessage({
                  type: 'input_focus',
                  data: {
                    type: e.target.type || 'text',
                    placeholder: e.target.placeholder || ''
                  }
                }, '*');
              }
            }, true);
            
            // Track URL changes (for SPAs)
            let currentUrl = window.location.href;
            setInterval(() => {
              if (window.location.href !== currentUrl) {
                window.parent.postMessage({
                  type: 'route_change',
                  data: { from: currentUrl, to: window.location.href }
                }, '*');
                currentUrl = window.location.href;
              }
            }, 500);
          })();
        `
        iframeDoc.head.appendChild(script)
      } catch (e) {
        // Cross-origin - will use postMessage listener instead
      }
    }

    // Listen for messages from iframe
    const handleMessage = (event: MessageEvent) => {
      console.log('📨 Message received from iframe:', event.data)
      if (event.data && typeof event.data === 'object' && event.data.type) {
        sendEvent(event.data)
      }
    }

    window.addEventListener('message', handleMessage)

    // Check route changes periodically
    const routeCheckInterval = setInterval(checkRouteChange, 1000)

    // Handle iframe load
    const handleLoad = () => {
      setIframeError(false)
      setTimeout(injectObserver, 500)
      sendEvent({ type: 'page_load', data: { url: testAppUrl } })
    }

    // Handle iframe errors
    const handleError = () => {
      setIframeError(true)
    }

    iframe.addEventListener('load', handleLoad)
    iframe.addEventListener('error', handleError)

    // Inactivity detection
    const resetInactivityTimer = () => {
      if (inactivityTimer) clearTimeout(inactivityTimer)
      inactivityTimer = setTimeout(() => {
        const timeSinceLastAction = Date.now() - lastActionTime
        if (timeSinceLastAction > 30000) {
          sendEvent({ type: 'inactivity', data: { duration: timeSinceLastAction } })
        }
      }, 30000)
    }

    resetInactivityTimer()

    return () => {
      window.removeEventListener('message', handleMessage)
      clearInterval(routeCheckInterval)
      if (inactivityTimer) clearTimeout(inactivityTimer)
      iframe.removeEventListener('load', handleLoad)
      iframe.removeEventListener('error', handleError)
    }
  }, [sessionActive, setUserEvents, sessionStartTime, testAppUrl, useProxy])

  const proxyUrl = useProxy ? `/api/proxy?url=${encodeURIComponent(testAppUrl)}` : testAppUrl

  if (iframeError && !useProxy) {
    return (
      <div className="flex-1 h-full bg-background border-r border-border flex items-center justify-center p-8">
        <Card className="max-w-2xl w-full p-8">
          <div className="flex flex-col items-center space-y-4 text-center">
            <AlertCircle className="w-16 h-16 text-muted-foreground" />
            <h2 className="text-2xl font-semibold">Unable to Load Website</h2>
            <p className="text-muted-foreground">
              This website blocks iframe embedding for security reasons. This is common for sites like Vercel, GitHub, and many others.
            </p>
            <div className="space-y-2 w-full">
              <Button
                onClick={() => {
                  setUseProxy(true)
                  setIframeError(false)
                }}
                className="w-full"
              >
                Try Proxy Mode (May have limitations)
              </Button>
              <p className="text-xs text-muted-foreground">
                Note: Some features may not work correctly in proxy mode. For best results, use a website that allows iframe embedding, or test with the included demo app.
              </p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 h-full bg-background border-r border-border">
      <iframe
        key={proxyUrl}
        ref={iframeRef}
        src={proxyUrl}
        className="w-full h-full border-0"
        title="App under test"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-navigation"
      />
    </div>
  )
}
