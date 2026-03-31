'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type UploadState = 'idle' | 'uploading' | 'parsing' | 'done' | 'error'

export function CVUpload() {
  const [state, setState] = useState<UploadState>('idle')
  const [fileName, setFileName] = useState<string | null>(null)
  const [pasteMode, setPasteMode] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const onDrop = useCallback(async (accepted: File[]) => {
    const file = accepted[0]
    if (!file) return
    setFileName(file.name)
    setState('uploading')
    setErrorMsg(null)

    try {
      // Simulate upload + parsing for Sprint Zero
      await new Promise((r) => setTimeout(r, 800))
      setState('parsing')
      await new Promise((r) => setTimeout(r, 1600))
      setState('done')
    } catch {
      setState('error')
      setErrorMsg('Upload failed. Please try again.')
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
    disabled: state === 'uploading' || state === 'parsing',
  })

  async function handlePasteSubmit() {
    if (!pasteText.trim()) return
    setState('parsing')
    setErrorMsg(null)
    try {
      await new Promise((r) => setTimeout(r, 1600))
      setState('done')
    } catch {
      setState('error')
      setErrorMsg('Parsing failed. Please try again.')
    }
  }

  if (state === 'done') {
    return (
      <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-lg)] p-8 flex flex-col items-center gap-4 text-center">
        <CheckCircle2 size={40} className="text-[var(--color-signal-strong)]" />
        <div>
          <p className="text-[17px] font-semibold text-[var(--color-text-primary)]">
            Profile built successfully
          </p>
          <p className="text-[14px] text-[var(--color-text-secondary)] mt-1">
            {fileName ? `Parsed from ${fileName}` : 'Parsed from your text'}
            {' — '}review and edit your Candidate Graph below.
          </p>
        </div>
        <a
          href="/profile/graph"
          className="flex items-center gap-2 bg-[var(--color-primary)] text-white font-semibold text-[14px] px-5 py-2.5 rounded-[var(--radius-xl)] hover:bg-[var(--color-primary-dark)] transition-colors"
        >
          Review Candidate Graph →
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setPasteMode(false)}
          className={cn(
            'px-4 py-2 rounded-[var(--radius-md)] text-[14px] font-medium transition-colors',
            !pasteMode
              ? 'bg-[var(--color-primary)] text-white'
              : 'bg-[var(--color-background)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-[var(--color-primary)]',
          )}
        >
          Upload file
        </button>
        <button
          onClick={() => setPasteMode(true)}
          className={cn(
            'px-4 py-2 rounded-[var(--radius-md)] text-[14px] font-medium transition-colors',
            pasteMode
              ? 'bg-[var(--color-primary)] text-white'
              : 'bg-[var(--color-background)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-[var(--color-primary)]',
          )}
        >
          Paste text
        </button>
      </div>

      {!pasteMode ? (
        <div
          {...getRootProps()}
          className={cn(
            'bg-white border-2 border-dashed rounded-[var(--radius-lg)] p-12 flex flex-col items-center gap-3 text-center cursor-pointer transition-colors',
            isDragActive
              ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]'
              : 'border-[var(--color-border)] hover:border-[var(--color-primary)]',
            (state === 'uploading' || state === 'parsing') && 'pointer-events-none',
          )}
        >
          <input {...getInputProps()} />

          {state === 'idle' && (
            <>
              <div className="w-12 h-12 rounded-[var(--radius-lg)] bg-[var(--color-primary-light)] flex items-center justify-center">
                <Upload size={22} className="text-[var(--color-primary)]" />
              </div>
              <div>
                <p className="text-[15px] font-semibold text-[var(--color-text-primary)]">
                  {isDragActive ? 'Drop your CV here' : 'Drag and drop your CV'}
                </p>
                <p className="text-[13px] text-[var(--color-text-secondary)] mt-1">
                  or <span className="text-[var(--color-primary)] font-medium">browse to upload</span>
                </p>
                <p className="text-[12px] text-[var(--color-text-muted)] mt-2">
                  PDF, DOCX, or TXT — up to 5MB
                </p>
              </div>
            </>
          )}

          {state === 'uploading' && (
            <div className="flex flex-col items-center gap-2">
              <Loader2 size={28} className="text-[var(--color-primary)] animate-spin" />
              <p className="text-[14px] text-[var(--color-text-secondary)]">
                Uploading {fileName}…
              </p>
            </div>
          )}

          {state === 'parsing' && (
            <div className="flex flex-col items-center gap-2">
              <Loader2 size={28} className="text-[var(--color-primary)] animate-spin" />
              <p className="text-[15px] font-semibold text-[var(--color-text-primary)]">
                Building your Candidate Graph
              </p>
              <p className="text-[13px] text-[var(--color-text-secondary)]">
                Extracting roles, achievements, and stories…
              </p>
            </div>
          )}

          {state === 'error' && (
            <div className="flex flex-col items-center gap-2">
              <AlertCircle size={28} className="text-[var(--color-signal-critical)]" />
              <p className="text-[14px] text-[var(--color-signal-critical)]">{errorMsg}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[13px] text-[var(--color-text-secondary)]">
            <FileText size={15} />
            Paste your CV or LinkedIn profile text below
          </div>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder="Paste your full CV or LinkedIn profile here…"
            rows={14}
            className="w-full px-4 py-3 text-[14px] border border-[var(--color-border)] rounded-[var(--radius-lg)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors bg-white resize-none font-[var(--font-mono)] leading-relaxed"
          />
          <button
            onClick={handlePasteSubmit}
            disabled={!pasteText.trim() || state === 'parsing'}
            className="flex items-center gap-2 bg-[var(--color-primary)] text-white font-semibold text-[14px] px-5 py-2.5 rounded-[var(--radius-xl)] hover:bg-[var(--color-primary-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {state === 'parsing' && <Loader2 size={15} className="animate-spin" />}
            {state === 'parsing' ? 'Building graph…' : 'Build my Candidate Graph'}
          </button>
        </div>
      )}
    </div>
  )
}
