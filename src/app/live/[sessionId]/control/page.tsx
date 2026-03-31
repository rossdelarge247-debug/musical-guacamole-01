'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import {
  ChevronLeft,
  ChevronRight,
  BookmarkPlus,
  AlertTriangle,
  Minimize2,
  Maximize2,
  Star,
} from 'lucide-react'

type Density = 'minimal' | 'standard' | 'full'

const STORIES = [
  'Onboarding Redesign',
  'API v2 Failure',
  'Analytics Launch',
  'Stakeholder Alignment',
]

export default function ControlSurfacePage() {
  const params = useParams()
  const sessionId = params.sessionId as string

  const [density, setDensity] = useState<Density>('standard')
  const [storyIndex, setStoryIndex] = useState(0)
  const [bookmarks, setBookmarks] = useState<string[]>([])
  const [confidence, setConfidence] = useState<number | null>(null)
  const [lastAction, setLastAction] = useState<string | null>(null)

  function flash(msg: string) {
    setLastAction(msg)
    setTimeout(() => setLastAction(null), 1800)
  }

  function sendCommand(command: string, payload?: Record<string, unknown>) {
    // In production: publish to Supabase Realtime channel `session:${sessionId}`
    console.log('[Control]', command, payload)
    flash(command.replace(/_/g, ' '))
  }

  function prevStory() {
    const idx = (storyIndex - 1 + STORIES.length) % STORIES.length
    setStoryIndex(idx)
    sendCommand('switch_story', { story: STORIES[idx] })
  }

  function nextStory() {
    const idx = (storyIndex + 1) % STORIES.length
    setStoryIndex(idx)
    sendCommand('switch_story', { story: STORIES[idx] })
  }

  function bookmark() {
    const label = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    setBookmarks((b) => [...b, label])
    sendCommand('bookmark_moment', { time: label })
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-white flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[#1E293B] flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#64748B]">
            Control Surface
          </p>
          <p className="text-[13px] text-[#94A3B8] font-mono truncate max-w-[180px]">
            {sessionId}
          </p>
        </div>
        {/* Density toggle */}
        <div className="flex gap-1">
          {(['minimal', 'standard', 'full'] as Density[]).map((d) => (
            <button
              key={d}
              onClick={() => { setDensity(d); sendCommand(`set_density_${d}`) }}
              className={`px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wide transition-colors ${
                density === d
                  ? 'bg-[#2557A7] text-white'
                  : 'text-[#64748B] hover:text-white'
              }`}
            >
              {d === 'minimal' ? <Minimize2 size={12} /> : d === 'full' ? <Maximize2 size={12} /> : 'Std'}
            </button>
          ))}
        </div>
      </div>

      {/* Story switcher */}
      <div className="p-4 border-b border-[#1E293B]">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#64748B] mb-2">
          Active story
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={prevStory}
            className="w-10 h-10 rounded-full border border-[#334155] flex items-center justify-center hover:border-[#2557A7] transition-colors active:scale-95"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex-1 text-center">
            <p className="text-[15px] font-semibold leading-tight">{STORIES[storyIndex]}</p>
            <p className="text-[11px] text-[#64748B] mt-0.5">{storyIndex + 1} of {STORIES.length}</p>
          </div>
          <button
            onClick={nextStory}
            className="w-10 h-10 rounded-full border border-[#334155] flex items-center justify-center hover:border-[#2557A7] transition-colors active:scale-95"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Quick actions */}
      <div className="p-4 grid grid-cols-2 gap-3 border-b border-[#1E293B]">
        <button
          onClick={() => sendCommand('go_shorter')}
          className="py-3 rounded-[10px] border border-[#334155] text-[13px] font-medium hover:border-[#2557A7] hover:text-[#93C5FD] transition-colors active:scale-95"
        >
          Go shorter ↓
        </button>
        <button
          onClick={() => sendCommand('ask_for_evidence')}
          className="py-3 rounded-[10px] border border-[#334155] text-[13px] font-medium hover:border-[#2557A7] hover:text-[#93C5FD] transition-colors active:scale-95"
        >
          Add evidence ↑
        </button>
        <button
          onClick={() => sendCommand('harder_followup')}
          className="py-3 rounded-[10px] border border-[#F59E0B]/40 text-[13px] font-medium text-[#F59E0B] hover:border-[#F59E0B] transition-colors active:scale-95"
        >
          Harder follow-up ⚡
        </button>
        <button
          onClick={() => sendCommand('recovery_mode')}
          className="py-3 rounded-[10px] border border-[#F43F5E]/40 text-[13px] font-medium text-[#F43F5E] hover:border-[#F43F5E] transition-colors active:scale-95"
        >
          Recovery mode 🔴
        </button>
      </div>

      {/* Bookmark + shaky */}
      <div className="p-4 flex gap-3 border-b border-[#1E293B]">
        <button
          onClick={bookmark}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-[10px] bg-[#1E293B] text-[13px] font-medium hover:bg-[#334155] transition-colors active:scale-95"
        >
          <BookmarkPlus size={15} /> Bookmark
        </button>
        <button
          onClick={() => sendCommand('mark_shaky')}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-[10px] bg-[#1E293B] text-[13px] font-medium text-[#F59E0B] hover:bg-[#334155] transition-colors active:scale-95"
        >
          <AlertTriangle size={15} /> Shaky
        </button>
      </div>

      {/* Self-confidence rating */}
      <div className="p-4 border-b border-[#1E293B]">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#64748B] mb-3">
          How did that answer feel?
        </p>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => { setConfidence(n); sendCommand('self_rating', { score: n }) }}
              className={`flex-1 py-2.5 rounded-[8px] text-[13px] font-bold transition-colors active:scale-95 ${
                confidence === n
                  ? 'bg-[#2557A7] text-white'
                  : 'border border-[#334155] text-[#64748B] hover:border-[#2557A7] hover:text-white'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="flex justify-between mt-1 px-1">
          <span className="text-[10px] text-[#64748B]">Rough</span>
          <span className="text-[10px] text-[#64748B]">Strong</span>
        </div>
      </div>

      {/* Bookmarks log */}
      {bookmarks.length > 0 && (
        <div className="p-4 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#64748B] mb-2">
            Bookmarked moments
          </p>
          <div className="space-y-1">
            {bookmarks.map((b, i) => (
              <div key={i} className="flex items-center gap-2 text-[13px] text-[#94A3B8]">
                <Star size={11} className="text-[#F59E0B]" />
                {b}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action flash feedback */}
      {lastAction && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#2557A7] text-white text-[13px] font-medium px-4 py-2 rounded-full capitalize shadow-lg">
          {lastAction}
        </div>
      )}
    </div>
  )
}
