import type { Metadata } from 'next'
import Link from 'next/link'
import { Monitor, Smartphone, ArrowRight } from 'lucide-react'

export const metadata: Metadata = { title: 'Live Workspace Setup' }

export default async function LiveSessionSetupPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  const teleprompterUrl = `/live/${sessionId}/teleprompter`
  const controlUrl = `/live/${sessionId}/control`

  return (
    <div className="min-h-screen bg-[var(--color-teleprompter-bg)] flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#94A3B8]">
            Live Workspace
          </p>
          <h1 className="text-[28px] font-semibold text-white">Set up your surfaces</h1>
          <p className="text-[15px] text-[#94A3B8]">
            Open the teleprompter on your second screen, and the control surface on your phone.
          </p>
        </div>

        <div className="space-y-3">
          {/* Teleprompter */}
          <div className="bg-[#1E293B] border border-[#334155] rounded-[var(--radius-lg)] p-5 space-y-3">
            <div className="flex items-center gap-3">
              <Monitor size={20} className="text-[var(--color-primary)]" />
              <div>
                <p className="text-[15px] font-semibold text-white">Teleprompter</p>
                <p className="text-[13px] text-[#94A3B8]">
                  Open on your second monitor or drag to a separate window
                </p>
              </div>
            </div>
            <Link
              href={teleprompterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between w-full px-4 py-2.5 bg-[var(--color-primary)] text-white rounded-[var(--radius-lg)] text-[14px] font-medium hover:bg-[var(--color-primary-dark)] transition-colors"
            >
              <span>Open teleprompter</span>
              <ArrowRight size={15} />
            </Link>
            <p className="text-[12px] text-[#64748B] font-mono truncate">{teleprompterUrl}</p>
          </div>

          {/* Control surface */}
          <div className="bg-[#1E293B] border border-[#334155] rounded-[var(--radius-lg)] p-5 space-y-3">
            <div className="flex items-center gap-3">
              <Smartphone size={20} className="text-[var(--color-signal-strong)]" />
              <div>
                <p className="text-[15px] font-semibold text-white">Control surface</p>
                <p className="text-[13px] text-[#94A3B8]">
                  Scan on your phone to open the control surface
                </p>
              </div>
            </div>
            {/* QR code placeholder — generated dynamically in R3 */}
            <div className="w-28 h-28 bg-white rounded-[var(--radius-md)] flex items-center justify-center mx-auto">
              <p className="text-[10px] text-[#6B7280] text-center px-2">
                QR code in R3
              </p>
            </div>
            <p className="text-[12px] text-[#64748B] font-mono truncate text-center">{controlUrl}</p>
          </div>
        </div>

        <p className="text-center text-[13px] text-[#64748B]">
          Both surfaces will sync automatically once connected.
        </p>
      </div>
    </div>
  )
}
