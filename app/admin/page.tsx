'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Loader2, CheckSquare, Square, Eye, FileText } from 'lucide-react'
import Link from 'next/link'

interface TestSession {
  id: string
  test_url: string
  user_events: any[]
  conversation_history: Array<{ speaker: 'ai' | 'user'; text: string; timestamp: number }>
  survey_answers: Record<string, number>
  summary?: string
  created_at: string
  session_duration?: number
}

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [sessions, setSessions] = useState<TestSession[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set())
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [crossSessionSummary, setCrossSessionSummary] = useState<string>('')
  const [viewingSession, setViewingSession] = useState<TestSession | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if already authenticated (stored in sessionStorage)
    const authToken = sessionStorage.getItem('admin_auth_token')
    if (authToken) {
      setIsAuthenticated(true)
      fetchSessions(authToken)
    }
  }, [])

  const handleLogin = async () => {
    if (!password) {
      setError('Please enter password')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Verify password by making a test request
      const response = await fetch('/api/admin/sessions', {
        headers: {
          'Authorization': `Bearer ${password}`,
        },
      })

      if (response.ok) {
        setIsAuthenticated(true)
        sessionStorage.setItem('admin_auth_token', password)
        fetchSessions(password)
      } else {
        setError('Invalid password')
      }
    } catch (err) {
      setError('Failed to authenticate')
    } finally {
      setLoading(false)
    }
  }

  const fetchSessions = async (authToken: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/sessions', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch sessions')
      }

      const data = await response.json()
      setSessions(data.sessions || [])
    } catch (err) {
      setError('Failed to load sessions')
    } finally {
      setLoading(false)
    }
  }

  const toggleSessionSelection = (sessionId: string) => {
    const newSelected = new Set(selectedSessions)
    if (newSelected.has(sessionId)) {
      newSelected.delete(sessionId)
    } else {
      newSelected.add(sessionId)
    }
    setSelectedSessions(newSelected)
  }

  const toggleAllSessions = () => {
    if (selectedSessions.size === sessions.length) {
      setSelectedSessions(new Set())
    } else {
      setSelectedSessions(new Set(sessions.map(s => s.id)))
    }
  }

  const handleSummarize = async () => {
    if (selectedSessions.size === 0) {
      setError('Please select at least one session')
      return
    }

    setIsSummarizing(true)
    setError(null)
    setCrossSessionSummary('')

    try {
      const authToken = sessionStorage.getItem('admin_auth_token')
      const response = await fetch('/api/admin/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          sessionIds: Array.from(selectedSessions),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate summary')
      }

      const data = await response.json()
      setCrossSessionSummary(data.summary)
    } catch (err: any) {
      setError(err.message || 'Failed to generate cross-session summary')
    } finally {
      setIsSummarizing(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const getSummaryPreview = (summary?: string) => {
    if (!summary) return 'No summary available'
    return summary.length > 150 ? summary.substring(0, 150) + '...' : summary
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Admin Login</CardTitle>
            <CardDescription>Enter admin password to access the dashboard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin password"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleLogin()
                }
              }}
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={handleLogin} disabled={loading} className="w-full">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 overflow-y-auto bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-6 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              View and analyze usability test sessions
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/">
              <Button variant="outline">Back to Home</Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => {
                sessionStorage.removeItem('admin_auth_token')
                setIsAuthenticated(false)
                setPassword('')
              }}
            >
              Logout
            </Button>
          </div>
        </div>

        {/* Cross-session Summary Section */}
        {selectedSessions.size > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Cross-Session Analysis</CardTitle>
              <CardDescription>
                {selectedSessions.size} session(s) selected
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={handleSummarize}
                disabled={isSummarizing || selectedSessions.size === 0}
                className="w-full"
              >
                {isSummarizing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Generating Summary...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Cross-Session Summary
                  </>
                )}
              </Button>

              {crossSessionSummary && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2">Cross-Session Summary</h3>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {crossSessionSummary}
                  </div>
                </div>
              )}

              {error && (
                <div className="p-4 bg-destructive/10 rounded-lg">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Sessions List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Test Sessions</CardTitle>
                <CardDescription>
                  {sessions.length} total session(s)
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleAllSessions}
                >
                  {selectedSessions.size === sessions.length ? (
                    <>
                      <CheckSquare className="w-4 h-4 mr-2" />
                      Deselect All
                    </>
                  ) : (
                    <>
                      <Square className="w-4 h-4 mr-2" />
                      Select All
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchSessions(sessionStorage.getItem('admin_auth_token') || '')}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Refresh'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading && sessions.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No test sessions found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sessions.map((session) => (
                  <Card key={session.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <button
                          onClick={() => toggleSessionSelection(session.id)}
                          className="mt-1"
                        >
                          {selectedSessions.has(session.id) ? (
                            <CheckSquare className="w-5 h-5" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold">{session.test_url}</h3>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(session.created_at)} • Duration: {formatDuration(session.session_duration)}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setViewingSession(viewingSession?.id === session.id ? null : session)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              {viewingSession?.id === session.id ? 'Hide' : 'View'}
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {getSummaryPreview(session.summary)}
                          </p>
                          {viewingSession?.id === session.id && (
                            <div className="mt-4 p-4 bg-muted rounded-lg space-y-4">
                              <div>
                                <h4 className="font-semibold mb-2">Full Summary</h4>
                                <div className="whitespace-pre-wrap text-sm">
                                  {session.summary || 'No summary available'}
                                </div>
                              </div>
                              <div>
                                <h4 className="font-semibold mb-2">User Events ({session.user_events.length})</h4>
                                <div className="text-sm space-y-1 max-h-40 overflow-y-auto">
                                  {session.user_events.slice(0, 10).map((event: any, idx: number) => (
                                    <div key={idx} className="text-muted-foreground">
                                      {event.type} {event.data ? `: ${JSON.stringify(event.data)}` : ''}
                                    </div>
                                  ))}
                                  {session.user_events.length > 10 && (
                                    <div className="text-muted-foreground italic">
                                      ... and {session.user_events.length - 10} more
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div>
                                <h4 className="font-semibold mb-2">Survey Answers</h4>
                                <div className="text-sm space-y-1">
                                  {Object.entries(session.survey_answers).map(([key, value]) => (
                                    <div key={key}>
                                      Question {key}: {value}/5
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

