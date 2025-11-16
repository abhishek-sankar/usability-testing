'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, LayoutGrid, List, Plus, ArrowUpRight } from 'lucide-react'
import { adminFetch, clearAdminToken, getAdminToken, setAdminToken } from '@/lib/admin-api'

type ProjectStatus = 'draft' | 'live' | 'offline' | 'template'
type ViewMode = 'grid' | 'list'

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

interface SectionDraft {
  title: string
  goal: string
  prompt: string
}

const STATUS_OPTIONS: Array<{ label: string; value: ProjectStatus | 'all' }> = [
  { label: 'All Statuses', value: 'all' },
  { label: 'Live', value: 'live' },
  { label: 'Draft', value: 'draft' },
  { label: 'Offline', value: 'offline' },
  { label: 'Template', value: 'template' },
]

const STATUS_STYLES: Record<ProjectStatus, string> = {
  live: 'bg-green-100 text-green-800',
  draft: 'bg-orange-100 text-orange-800',
  offline: 'bg-gray-200 text-gray-800',
  template: 'bg-indigo-100 text-indigo-800',
}

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    const storedToken = getAdminToken()
    if (storedToken) {
      setAuthToken(storedToken)
    }
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(searchTerm), 350)
    return () => clearTimeout(timeout)
  }, [searchTerm])

  useEffect(() => {
    if (!authToken) return
    void fetchProjects(authToken)
  }, [authToken, statusFilter, debouncedSearch])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(timer)
  }, [toast])

  const isAuthenticated = Boolean(authToken)

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
      setToast({ type: 'success', message: 'Logged in successfully' })
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate')
      setToast({ type: 'error', message: err.message || 'Failed to authenticate' })
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async (token: string, showLoading = true) => {
    if (showLoading) setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (debouncedSearch.trim().length > 0) params.set('q', debouncedSearch.trim())

      const data = await adminFetch<{ projects: Project[] }>(`/api/projects?${params.toString()}`, undefined, token)
      setProjects(data.projects || [])
    } catch (err: any) {
      const message = err.message || 'Unable to load projects'
      setError(message)
      setToast({ type: 'error', message })
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  const stats = useMemo(() => {
    const total = projects.length
    return {
      total,
      live: projects.filter((p) => p.status === 'live').length,
      draft: projects.filter((p) => p.status === 'draft').length,
      offline: projects.filter((p) => p.status === 'offline').length,
      template: projects.filter((p) => p.status === 'template').length,
    }
  }, [projects])
  const showStatsSkeleton = loading && projects.length === 0
  const showProjectsSkeleton = loading && projects.length === 0

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Admin Login</CardTitle>
            <CardDescription>Enter the admin password to access the workspace</CardDescription>
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
      <div className="max-w-7xl mx-auto space-y-6 pb-8">
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
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Workspace Overview</h1>
            <p className="text-muted-foreground mt-2">
              Track every usability study, project, and prototype from one dashboard
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/">
              <Button variant="outline">Back to Home</Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => {
                clearAdminToken()
                setAuthToken(null)
                setPassword('')
              }}
            >
              Logout
            </Button>
          </div>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {showStatsSkeleton ? (
            Array.from({ length: 5 }).map((_, idx) => <SkeletonCard key={idx} />)
          ) : (
            <>
              <StatsCard label="All Projects" value={stats.total} accent="bg-blue-100 text-blue-900" />
              <StatsCard label="Live" value={stats.live} accent="bg-green-100 text-green-900" />
              <StatsCard label="Drafts" value={stats.draft} accent="bg-orange-100 text-orange-900" />
              <StatsCard label="Offline" value={stats.offline} accent="bg-gray-200 text-gray-800" />
              <StatsCard label="Templates" value={stats.template} accent="bg-indigo-100 text-indigo-900" />
            </>
          )}
        </section>

        <section className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-1 gap-2">
            <Input
              placeholder="Search projects"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <select
              className="border border-input rounded-md px-3 py-2 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | 'all')}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Project
            </Button>
          </div>
        </section>

        {error && <div className="p-4 bg-destructive/10 text-sm text-destructive rounded-lg">{error}</div>}

        <section>
          {showProjectsSkeleton ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-24 text-muted-foreground">
              <p>No projects found. Try adjusting filters or create a new project.</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} viewMode="list" />
              ))}
            </div>
          )}
        </section>
      </div>

      {authToken && (
        <CreateProjectModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          authToken={authToken}
          onCreated={() => {
            setShowCreateModal(false)
            void fetchProjects(authToken, false)
          }}
        />
      )}
    </div>
  )
}

function StatsCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <Card>
      <CardContent className="pt-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-semibold">{value}</span>
          <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${accent}`}>current</span>
        </div>
      </CardContent>
    </Card>
  )
}

function ProjectCard({ project, viewMode = 'grid' }: { project: Project; viewMode?: ViewMode }) {
  const status = project.status || 'draft'

  const content = (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[status]}`}>
          {status.toUpperCase()}
        </span>
        <span className="text-xs text-muted-foreground">
          {project.updated_at ? new Date(project.updated_at).toLocaleDateString() : 'New'}
        </span>
      </div>
      <div>
        <h3 className="text-lg font-semibold">{project.name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {project.description || 'No description yet'}
        </p>
      </div>
      <div className="text-sm text-muted-foreground">
        Prototype:{' '}
        {project.prototype_url ? (
          <a href={project.prototype_url} className="text-primary underline" target="_blank" rel="noreferrer">
            Visit
          </a>
        ) : (
          'Not set'
        )}
      </div>
      <div className="flex justify-between items-center pt-2">
        <div className="text-xs text-muted-foreground">
          Created {project.created_at ? new Date(project.created_at).toLocaleDateString() : 'recently'}
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/admin/projects/${project.id}`} className="inline-flex items-center gap-1">
            View
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>
    </div>
  )

  if (viewMode === 'list') {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">{content}</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardContent className="p-4 h-full">{content}</CardContent>
    </Card>
  )
}

function SkeletonCard() {
  return (
    <Card>
      <CardContent className="pt-4 space-y-3 animate-pulse">
        <div className="h-3 w-1/3 bg-muted rounded" />
        <div className="h-6 w-2/3 bg-muted rounded" />
      </CardContent>
    </Card>
  )
}

interface CreateProjectModalProps {
  open: boolean
  onClose: () => void
  onCreated: (projectName: string) => void
  authToken: string
}

function CreateProjectModal({ open, onClose, onCreated, authToken }: CreateProjectModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<ProjectStatus>('draft')
  const [prototypeUrl, setPrototypeUrl] = useState('')
  const [introScript, setIntroScript] = useState('')
  const [walkthroughContext, setWalkthroughContext] = useState('')
  const [sections, setSections] = useState<SectionDraft[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setName('')
      setDescription('')
      setPrototypeUrl('')
      setIntroScript('')
      setWalkthroughContext('')
      setSections([])
      setError(null)
    }
  }, [open])

  const addSection = () => setSections((prev) => [...prev, { title: '', goal: '', prompt: '' }])
  const updateSection = (index: number, field: keyof SectionDraft, value: string) =>
    setSections((prev) => prev.map((section, idx) => (idx === index ? { ...section, [field]: value } : section)))
  const removeSection = (index: number) => setSections((prev) => prev.filter((_, idx) => idx !== index))

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Project name is required')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        status,
        prototypeUrl: prototypeUrl.trim(),
        introScript: introScript.trim(),
        walkthroughContext: walkthroughContext.trim(),
        sections: sections
          .filter((section) => section.title.trim())
          .map((section, index) => ({
            title: section.title.trim(),
            goal: section.goal.trim(),
            prompt: section.prompt.trim(),
            order_index: index,
          })),
      }

      await adminFetch(
        '/api/projects',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        },
        authToken,
      )

      onCreated(payload.name)
    } catch (err: any) {
      setError(err.message || 'Unable to create project')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Create New Project</CardTitle>
          <CardDescription>Configure Ava for a new product or prototype</CardDescription>
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
            {sections.length === 0 && (
              <p className="text-sm text-muted-foreground">No sections yet. Add one to define goals.</p>
            )}
            {sections.map((section, index) => (
              <Card key={index}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-semibold">Section {index + 1}</h4>
                    <Button variant="ghost" size="sm" onClick={() => removeSection(index)}>
                      Remove
                    </Button>
                  </div>
                  <Input
                    placeholder="Section title"
                    value={section.title}
                    onChange={(e) => updateSection(index, 'title', e.target.value)}
                  />
                  <Textarea
                    placeholder="Goal / success criteria"
                    value={section.goal}
                    onChange={(e) => updateSection(index, 'goal', e.target.value)}
                  />
                  <Textarea
                    placeholder="Prompt Ava should use"
                    value={section.prompt}
                    onChange={(e) => updateSection(index, 'prompt', e.target.value)}
                  />
                </CardContent>
              </Card>
            ))}
          </div>

          {error && <div className="text-sm text-destructive">{error}</div>}
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Create Project
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
