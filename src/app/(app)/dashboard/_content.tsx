'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Upload } from 'lucide-react'
import { GraphView } from '@/components/candidate-graph/graph-view'
import { QuotePanel } from '@/components/quote-panel'
import type { GraphNode } from '@/components/candidate-graph/graph-node-card'

interface GraphData {
  nodes: GraphNode[]
  skills: string[]
  headline: string
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
            nodes: parsed.nodes,
            skills: Array.isArray(parsed.profile?.skills) ? parsed.profile.skills : [],
            headline: parsed.profile?.headline ?? '',
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

  // Wait for localStorage check before rendering to avoid flicker
  if (graphData === null) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[30px] font-semibold text-[var(--color-text-primary)]">
            {greeting}
          </h1>
          <p className="text-[15px] text-[var(--color-text-secondary)] mt-1">
            {graphData ? 'Your professional history — the foundation of every answer.' : 'Your interview performance hub'}
          </p>
        </div>
        {graphData && (
          <Link
            href="/profile"
            className="shrink-0 flex items-center gap-2 text-[13px] font-medium px-4 py-2 rounded-[var(--radius-xl)] border border-[var(--color-border)] hover:border-[var(--color-primary)] text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
          >
            <Upload size={14} />
            Re-upload CV
          </Link>
        )}
      </div>

      {/* Getting started banner — before CV uploaded */}
      {graphData === false && (
        <div className="bg-[var(--color-primary)] rounded-[var(--radius-lg)] p-6 flex items-center justify-between gap-6 text-white">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider opacity-80">GET STARTED</p>
            <h2 className="text-[20px] font-semibold mt-1">Upload your CV to begin</h2>
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

      {/* Quote panel — above the graph */}
      {graphData && <QuotePanel position="top" />}

      {/* Candidate Graph — after CV uploaded, this IS the dashboard */}
      {graphData && (
        <GraphView initialNodes={graphData.nodes} initialSkills={graphData.skills} />
      )}
    </div>
  )
}
