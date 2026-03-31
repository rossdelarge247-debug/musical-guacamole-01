'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50">
      <div className="max-w-xl w-full bg-white rounded-2xl border border-red-200 p-8 shadow-sm">
        <h1 className="text-[20px] font-semibold text-red-700 mb-2">Something went wrong</h1>
        <p className="text-[14px] text-gray-600 mb-4">
          A client-side error occurred. Details below — share these when reporting the issue.
        </p>
        <div className="bg-gray-900 rounded-lg p-4 overflow-auto max-h-64 mb-4">
          <p className="text-red-400 text-[13px] font-mono whitespace-pre-wrap">
            {error.message}
          </p>
          {error.stack && (
            <p className="text-gray-400 text-[11px] font-mono whitespace-pre-wrap mt-2">
              {error.stack}
            </p>
          )}
          {error.digest && (
            <p className="text-gray-500 text-[11px] font-mono mt-2">digest: {error.digest}</p>
          )}
        </div>
        <button
          onClick={reset}
          className="px-4 py-2 bg-blue-600 text-white text-[14px] font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
