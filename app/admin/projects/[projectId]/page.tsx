'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'
import { adminFetch, getAdminToken, setAdminToken } from '@/lib/admin-api'
import { ChartContainer, ChartTooltip } from '@/components/ui/chart'
import { Bar, BarChart, Tooltip, XAxis, YAxis, ResponsiveContainer } from 'recharts'

type ProjectStatus = 'draft' | 'live' | 'offline' | 'template'

interface Project {
  id: string
  name: string
  description?: string
  status?: ProjectStatus
  prototype_url?: string
  intro_script?: string
  walkthrough_context?: string
  config?: Record<string, any>
  created_at?: string
  updated_at?: string
}

interface ProjectSection {
  id: string
  title: string
  goal?: string
  prompt?: string
}

interface AnalyticsResponse {
  project: Project
  metrics: {
    totalSessions: number
    averageDuration: number
    averageSentiment: number
    ratingDistribution: Record<string, number>
    questionAverages: Array<{ questionId: string; average: number; responses: number }>
    latestSessions: Array<{
      id: string
      summary?: string
      sentiment_score?: number
      created_at?: string
      session_duration?: number
    }>
  }
}

interface ProjectDetail {
  project: Project
  sections: ProjectSection[]
}

interface TestSession {
  id: string
  project_id?: string | null
  test_url: string
  user_events: any[]
  conversation_history: Array<{ speaker: 'ai' | 'user'; text: string; timestamp: number }>
  survey_answers: Record<string, number>
  summary?: string
  sentiment_score?: number
  created_at?: string
  session_duration?: number
}

export default function ProjectDetailPage() {
  const params = useParams<{ projectId: string }>()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [projectData, setProjectData] = useState<ProjectDetail | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsResponse['metrics'] | null>(null)
  const [sessions, setSessions] = useState<TestSession[]>([])
  const [selectedSession, setSelectedSession] = useState<TestSession | null>(null)
  const [insight, setInsight] = useState<string>('')
  const [insightLoading, setInsightLoading] = useState(false)
  const [insightError, setInsightError] = useState<string | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const storedToken = getAdminToken()
    if (storedToken) {
      setAuthToken(storedToken)
    }
  }, [])

  useEffect(() => {
    if (!authToken) return
    void fetchProject()
    void fetchAnalytics()
    void fetchSessionsList()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken, params.projectId])

  const isAuthenticated = Boolean(authToken)

  const fetchProject = async () => {
    if (!authToken) return
    setLoading(true)
    setError(null)
    try {
      const data = await adminFetch<ProjectDetail>(`/api/projects/${params.projectId}`, undefined, authToken)
      setProjectData(data)
    } catch (err: any) {
      setError(err.message || 'Unable to load project')
    } finally {
      setLoading(false)
    }
  }

  const fetchAnalytics = async () => {
    if (!authToken) return
    try {
      const data = await adminFetch<AnalyticsResponse>(
        `/api/projects/${params.projectId}/analytics`,
        undefined,
        authToken,
      )
      setAnalytics(data.metrics)
    } catch (err: any) {
      setError(err.message || 'Unable to load analytics')
    }
  }

  const fetchSessionsList = async () => {
    if (!authToken) return
    try {
      const data = await adminFetch<{ sessions: TestSession[] }>(
        `/api/projects/${params.projectId}/sessions`,
        undefined,
        authToken,
      )
      setSessions(data.sessions || [])
    } catch (err: any) {
      setError(err.message || 'Unable to load project sessions')
    }
  }

  const stats = useMemo(() => {
    if (!analytics) return null
    return [
      { label: 'Total Sessions', value: analytics.totalSessions },
      {
        label: 'Avg Duration',
        value: analytics.averageDuration ? `${Math.round(analytics.averageDuration)}s` : '—',
      },
      {
        label: 'Avg Sentiment',
        value: analytics.averageSentiment ? analytics.averageSentiment.toFixed(2) : 'Positive',
      },
    ]
  }, [analytics])

  const sessionsByDay = useMemo(() => {
    const today = new Date()
    const days = []
    for (let i = 4; i >= 0; i--) {
      const day = new Date(today)
      day.setDate(today.getDate() - i)
      const label = day.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })
      const key = day.toISOString().slice(0, 10)
      const value = sessions.filter((session) => {
        if (!session.created_at) return false
        return session.created_at.slice(0, 10) === key
      }).length
      days.push({ label, value })
    }
    return days
  }, [sessions])

  const maxSessionsPerDay = Math.max(...sessionsByDay.map((day) => day.value), 0)
  const chartMax = Math.max(maxSessionsPerDay + 3, 1)

  const handleLogin = async () => {
    if (!password) {
      setError('Please enter password')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await adminFetch('/api/admin/sessions', undefined, password)
      setAdminToken(password)
      setAuthToken(password)
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(timer)
  }, [toast])

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Admin Login</CardTitle>
            <CardDescription>Enter the admin password to access this project</CardDescription>
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
            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={handleLogin} disabled={loading}>
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
      <div className="max-w-5xl mx-auto space-y-6 pb-8">
        {toast && (
          <div
            className={`fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg text-sm ${
              toast.type === 'success'
                ? 'bg-green-600 text-white'
                : 'bg-destructive text-destructive-foreground'
            }`}
          >
            {toast.message}
          </div>
        )}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="px-3 py-1 rounded-full text-muted-foreground bg-white/70 shadow-sm border hover:text-foreground"
            >
              ← Back to workspace
            </Button>
            <h1 className="text-3xl font-bold mt-2">{projectData?.project.name || 'Loading project…'}</h1>
            <p className="text-muted-foreground mt-1">
              {projectData?.project.description || 'No description provided yet.'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowEditModal(true)} disabled={!projectData}>
              Edit Config
            </Button>
            <Button variant="outline" disabled>
              Duplicate
            </Button>
          </div>
        </div>

        {error && <div className="p-4 bg-destructive/10 text-sm text-destructive rounded-lg">{error}</div>}

        <section className="grid gap-4 md:grid-cols-3">
          {stats?.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="py-6">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-semibold mt-1">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Sessions (Past 7 Days)</CardTitle>
              <CardDescription>Daily count of captured sessions.</CardDescription>
            </CardHeader>
            <CardContent style={{ height: 300 }}>
              {sessions.length ? (
                <ChartContainer
                  config={{
                    value: { label: 'Sessions', color: 'hsl(var(--primary))' },
                  }}
                  className="h-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sessionsByDay}>
                      <XAxis dataKey="label" tickLine={false} axisLine={false} />
                      <YAxis allowDecimals={false} domain={[0, chartMax]} tickLine={false} axisLine={false} />
                      <Tooltip
                        cursor={{ fill: 'transparent' }}
                        content={({ active, payload, label }) => (
                          <ChartTooltip
                            active={active}
                            payload={payload}
                            label={label}
                            formatter={(value) => `${value} session${value === 1 ? '' : 's'}`}
                          />
                        )}
                      />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <p className="text-sm text-muted-foreground">No sessions recorded yet.</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Question Averages</CardTitle>
              <CardDescription>Average rating per question.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {analytics?.questionAverages?.length ? (
                analytics.questionAverages.map((q) => (
                  <div key={q.questionId} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Question {q.questionId}</span>
                    <span className="font-medium">
                      {q.average.toFixed(1)} ({q.responses} responses)
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No question responses yet.</p>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Sections & Goals</CardTitle>
              <CardDescription>Key objectives defined for this study.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {projectData?.sections?.length ? (
                projectData.sections.map((section) => (
                  <Card key={section.id}>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{section.title}</h4>
                        <span className="text-xs text-muted-foreground">Goal</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{section.goal || 'No goal specified.'}</p>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground">Prompt</p>
                        <p className="text-sm">{section.prompt || '—'}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No sections defined yet.</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Latest Sessions</CardTitle>
              <CardDescription>Recent participant summaries.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {analytics?.latestSessions?.length ? (
                analytics.latestSessions.slice(0, 3).map((sessionMeta) => {
                  const fullSession = sessions.find((s) => s.id === sessionMeta.id) || null
                  return (
                    <Card key={sessionMeta.id}>
                      <CardContent
                        className="p-4 space-y-2 cursor-pointer"
                        onClick={() => fullSession && setSelectedSession(fullSession)}
                      >
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{sessionMeta.created_at ? new Date(sessionMeta.created_at).toLocaleString() : 'Recent'}</span>
                          <span>Duration: {sessionMeta.session_duration ? `${sessionMeta.session_duration}s` : '—'}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Session ID: {sessionMeta.id.slice(0, 8)}…</p>
                        <p
                          className="text-sm whitespace-pre-line"
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {sessionMeta.summary || 'No summary yet.'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Sentiment:{' '}
                          {sessionMeta.sentiment_score !== undefined && sessionMeta.sentiment_score !== null
                            ? sessionMeta.sentiment_score.toFixed(2)
                            : 'N/A'}
                        </p>
                        {!fullSession && (
                          <p className="text-[11px] text-muted-foreground italic">
                            Detailed data unavailable yet; open from Sessions list below.
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )
                })
              ) : (
                <p className="text-sm text-muted-foreground">No sessions recorded.</p>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Sessions</CardTitle>
              <CardDescription>
                Full list of participant sessions captured for this project.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No sessions recorded yet.</p>
              ) : (
                sessions.map((session) => (
                  <Card key={session.id}>
                    <CardContent className="p-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm font-semibold">{session.test_url}</p>
                        <p className="text-xs text-muted-foreground">
                          {session.created_at ? new Date(session.created_at).toLocaleString() : 'Recent'} • Duration:{' '}
                          {session.session_duration ? `${session.session_duration}s` : '—'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Sentiment:{' '}
                          {session.sentiment_score !== undefined && session.sentiment_score !== null
                            ? session.sentiment_score.toFixed(2)
                            : 'N/A'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedSession(session)}>
                          View details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </section>
      </div>

      {selectedSession && (
        <SessionDrawer
          session={selectedSession}
          onClose={() => {
            setSelectedSession(null)
            setInsight('')
            setInsightError(null)
          }}
          insight={insight}
          insightError={insightError}
          insightLoading={insightLoading}
          onGenerateInsight={async () => {
            setInsightLoading(true)
            setInsightError(null)
            try {
              const response = await fetch('/api/summary', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  userEvents: selectedSession.user_events,
                  conversationHistory: selectedSession.conversation_history,
                  surveyAnswers: selectedSession.survey_answers,
                  testUrl: selectedSession.test_url,
                }),
              })

              if (!response.ok) {
                throw new Error('Failed to generate insight')
              }

              const data = await response.json()
              setInsight(data.summary || 'No insight generated.')
            } catch (err: any) {
              setInsightError(err.message || 'Unable to generate insight')
            } finally {
              setInsightLoading(false)
            }
          }}
        />
      )}
      {showEditModal && projectData && authToken && (
        <EditProjectModal
          project={projectData.project}
          sections={projectData.sections}
          authToken={authToken}
          onClose={() => setShowEditModal(false)}
          onUpdated={() => {
            void fetchProject()
            void fetchAnalytics()
            setToast({ type: 'success', message: 'Project updated' })
            setShowEditModal(false)
          }}
          onError={(message) => setToast({ type: 'error', message })}
        />
      )}
    </div>
  )
}

function SessionDrawer({
  session,
  onClose,
  insight,
  insightError,
  insightLoading,
  onGenerateInsight,
}: {
  session: TestSession
  onClose: () => void
  insight: string
  insightError: string | null
  insightLoading: boolean
  onGenerateInsight: () => Promise<void>
}) {
  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-end"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl h-full bg-background shadow-2xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 flex items-center justify-between border-b">
          <div>
            <h2 className="text-2xl font-semibold">Session Detail</h2>
            <p className="text-sm text-muted-foreground">
              {session.created_at ? new Date(session.created_at).toLocaleString() : 'Recent'}
            </p>
          </div>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="p-6 space-y-6">
          <section>
            <h3 className="text-lg font-semibold mb-2">Summary</h3>
            <p className="text-sm text-muted-foreground">
              {session.summary || 'No summary has been generated for this session.'}
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">Conversation</h3>
            <div className="space-y-2 text-sm">
              {session.conversation_history.map((message, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-muted">
                  <p className="text-xs font-semibold text-muted-foreground">
                    {message.speaker === 'ai' ? 'Ava' : 'Participant'}
                  </p>
                  <p>{message.text}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">User Events</h3>
            <div className="space-y-1 text-sm max-h-40 overflow-y-auto">
              {session.user_events.map((event, idx) => (
                <div key={idx} className="text-muted-foreground">
                  {event.type} {event.data ? `— ${JSON.stringify(event.data)}` : ''}
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">Survey Answers</h3>
            <div className="space-y-1 text-sm">
              {Object.entries(session.survey_answers).map(([key, value]) => (
                <div key={key}>
                  Question {key}: {value}/5
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-semibold">AI Insight</h3>
            <Button onClick={onGenerateInsight} disabled={insightLoading}>
              {insightLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Generate Insight
            </Button>
            {insightError && <p className="text-sm text-destructive">{insightError}</p>}
            {insight && (
              <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap text-sm leading-relaxed">{insight}</div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

interface EditProjectModalProps {
  project: Project
  sections: ProjectSection[]
  authToken: string
  onClose: () => void
  onUpdated: () => void
  onError: (message: string) => void
}

function EditProjectModal({ project, sections, authToken, onClose, onUpdated, onError }: EditProjectModalProps) {
  const [name, setName] = useState(project.name)
  const [description, setDescription] = useState(project.description || '')
  const [status, setStatus] = useState<ProjectStatus>(project.status || 'draft')
  const [prototypeUrl, setPrototypeUrl] = useState(project.prototype_url || '')
  const [introScript, setIntroScript] = useState(project.intro_script || '')
  const [walkthroughContext, setWalkthroughContext] = useState(project.walkthrough_context || '')
  const [sectionDrafts, setSectionDrafts] = useState<ProjectSection[]>(
    sections.map((section) => ({
      id: section.id,
      title: section.title,
      goal: section.goal,
      prompt: section.prompt,
    })),
  )
  const [submitting, setSubmitting] = useState(false)

  const addSection = () => {
    setSectionDrafts((prev) => [...prev, { id: crypto.randomUUID(), title: '', goal: '', prompt: '' }])
  }

  const updateSection = (sectionId: string, field: keyof ProjectSection, value: string) => {
    setSectionDrafts((prev) =>
      prev.map((section) => (section.id === sectionId ? { ...section, [field]: value } : section)),
    )
  }

  const removeSection = (sectionId: string) => {
    setSectionDrafts((prev) => prev.filter((section) => section.id !== sectionId))
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      onError('Project name is required')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        status,
        prototypeUrl: prototypeUrl.trim(),
        introScript: introScript.trim(),
        walkthroughContext: walkthroughContext.trim(),
        sections: sectionDrafts
          .filter((section) => section.title.trim())
          .map((section, index) => ({
            title: section.title.trim(),
            goal: section.goal?.trim() || '',
            prompt: section.prompt?.trim() || '',
            order_index: index,
          })),
      }

      await adminFetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }, authToken)

      onUpdated()
    } catch (err: any) {
      onError(err.message || 'Failed to update project')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <CardHeader>
            <CardTitle>Edit Project</CardTitle>
            <CardDescription>Update configuration shown to Ava during this study.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Project name" />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this test covering?"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Status</label>
                <select
                  className="border border-input rounded-md px-3 py-2 text-sm"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                >
                  {['draft', 'live', 'offline', 'template'].map((value) => (
                    <option key={value} value={value}>
                      {value.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Prototype URL</label>
                <Input
                  value={prototypeUrl}
                  onChange={(e) => setPrototypeUrl(e.target.value)}
                  placeholder="https://figma.com/proto/..."
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Intro Script</label>
                <Textarea
                  value={introScript}
                  onChange={(e) => setIntroScript(e.target.value)}
                  placeholder="Welcome message Ava will say at the start"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Walkthrough Context</label>
                <Textarea
                  value={walkthroughContext}
                  onChange={(e) => setWalkthroughContext(e.target.value)}
                  placeholder="Details about this experience for Ava to reference"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold">Sections & Goals</h3>
                  <p className="text-xs text-muted-foreground">Define the key objectives Ava should guide through.</p>
                </div>
                <Button variant="outline" size="sm" onClick={addSection}>
                  Add Section
                </Button>
              </div>
              {sectionDrafts.length === 0 && (
                <p className="text-sm text-muted-foreground">No sections yet. Add one to define goals.</p>
              )}
              {sectionDrafts.map((section, index) => (
                <Card key={section.id}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-semibold">Section {index + 1}</h4>
                      <Button variant="ghost" size="sm" onClick={() => removeSection(section.id)}>
                        Remove
                      </Button>
                    </div>
                    <Input
                      placeholder="Section title"
                      value={section.title}
                      onChange={(e) => updateSection(section.id, 'title', e.target.value)}
                    />
                    <Textarea
                      placeholder="Goal / success criteria"
                      value={section.goal || ''}
                      onChange={(e) => updateSection(section.id, 'goal', e.target.value)}
                    />
                    <Textarea
                      placeholder="Prompt Ava should use"
                      value={section.prompt || ''}
                      onChange={(e) => updateSection(section.id, 'prompt', e.target.value)}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </CardFooter>
      </Card>
    </div>
  )
}

