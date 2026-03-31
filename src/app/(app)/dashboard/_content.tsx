'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Upload, ArrowRight, CheckCircle2 } from 'lucide-react'

interface GraphData {
  headline: string
  skills: string[]
  nodeCount: number
}

export function DashboardContent({ firstName }: { firstName: string | null }) {
  const [graphData, setGraphData] = useState<GraphData | null | false>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('im:graph')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed.nodes) && parsed.nodes.length > 0) {
          setGraphData({
            headline: parsed.profile?.headline ?? '',
            skills: Array.isArray(parsed.profile?.skills) ? parsed.profile.skills : [],
            nodeCount: parsed.nodes.length,
          })
          return
        }
      }
      setGraphData(false)
    } catch {
      setGraphData(false)
    }
  }, [])

  const greeting = firstName ? `Welcome, ${firstName}` : 'Welcome back'

  // Wait for localStorage check before rendering to avoid layout flicker
  if (graphData === null) return null

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-[30px] font-semibold text-[var(--color-text-primary)]">
          {greeting}
        </h1>
        <p className="text-[15px] text-[var(--color-text-secondary)] mt-1">
          Your interview performance hub
        </p>
      </div>

      {/* Getting started banner — shown until CV is uploaded */}
      {graphData === false && (
        <div className="bg-[var(--color-primary)] rounded-[var(--radius-lg)] p-6 flex items-center justify-between gap-6 text-white">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider opacity-80">
              GET STARTED
            </p>
            <h2 className="text-[20px] font-semibold mt-1">
              Upload your CV to begin
            </h2>
            <p className="text-[14px] opacity-85 mt-1">
              We&apos;ll build your Candidate Graph and mine your best stories automatically.
            </p>
          </div>
          <Link
            href="/profile"
            className="shrink-0 flex items-center gap-2 bg-white text-[var(--color-primary)] font-semibold text-[14px] px-5 py-2.5 rounded-[var(--radius-xl)] hover:bg-blue-50 transition-colors"
          >
            <Upload size={15} />
            Upload CV
          </Link>
        </div>
      )}

      {/* Candidate Graph ready panel — shown after CV uploaded */}
      {graphData && (
        <div
          className="rounded-[var(--radius-lg)] border p-6 space-y-5"
          style={{ background: '#F0FDF4', borderColor: '#BBF7D0' }}
        >
          {/* Header */}
          <div className="flex items-start gap-3">
            <CheckCircle2 size={22} style={{ color: '#16A34A' }} className="shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-[16px] font-semibold" style={{ color: '#15803D' }}>
                Your Candidate Graph is ready
              </p>
              {graphData.headline && (
                <p className="text-[14px] mt-0.5" style={{ color: '#166534' }}>
                  {graphData.headline}
                </p>
              )}
            </div>
          </div>

          {/* Node count */}
          <p className="text-[14px] font-medium" style={{ color: '#166534' }}>
            {graphData.nodeCount} career moment{graphData.nodeCount !== 1 ? 's' : ''} mapped
          </p>

          {/* Skills */}
          {graphData.skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {graphData.skills.slice(0, 10).map((s) => (
                <span
                  key={s}
                  className="px-2.5 py-1 rounded-full text-[12px] font-medium"
                  style={{ background: '#DCFCE7', color: '#166534', border: '1px solid #86EFAC' }}
                >
                  {s}
                </span>
              ))}
            </div>
          )}

          {/* CTAs */}
          <div className="flex items-center gap-3 flex-wrap pt-1">
            <Link
              href="/profile/graph"
              className="inline-flex items-center gap-2 bg-[var(--color-primary)] text-white font-semibold text-[14px] px-5 py-2.5 rounded-[var(--radius-xl)] hover:opacity-90 transition-opacity"
            >
              Review Candidate Graph
              <ArrowRight size={14} />
            </Link>
            <Link
              href="/packs/new"
              className="inline-flex items-center gap-2 bg-white text-[var(--color-primary)] font-semibold text-[14px] px-5 py-2.5 rounded-[var(--radius-xl)] border border-[var(--color-primary)]/30 hover:bg-[var(--color-primary-light)] transition-colors"
            >
              Build Interview Pack
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
