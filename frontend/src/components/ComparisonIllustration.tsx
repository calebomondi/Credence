import { Building2, Check, Wallet, X } from "lucide-react"

type Row = { label: string; ok: boolean }

const traditional: Row[] = [
  { label: "House Ownership", ok: true },
  { label: "Bank Account", ok: true },
  { label: "Credit Bureau", ok: true },
  { label: "Salary History", ok: true },
]

const crypto: Row[] = [
  { label: "Stablecoin Savings", ok: true },
  { label: "Wallet History", ok: true },
  { label: "Long-Term Holdings", ok: true },
  { label: "Not recognized by lenders", ok: false },
]

function StatusIcon({ ok }: { ok: boolean }) {
  if (ok) {
    return (
      <span className="w-6 h-6 rounded-full bg-success-20 flex items-center justify-center shrink-0">
        <Check className="w-3.5 h-3.5 text-success" strokeWidth={3} aria-hidden="true" />
      </span>
    )
  }
  return (
    <span className="w-6 h-6 rounded-full bg-red-400/20 flex items-center justify-center shrink-0">
      <X className="w-3.5 h-3.5 text-red-400" strokeWidth={3} aria-hidden="true" />
    </span>
  )
}

function Row({ row }: { row: Row }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <StatusIcon ok={row.ok} />
      <span className={row.ok ? "text-sm text-primary-70" : "text-sm font-semibold text-red-400"}>
        {row.label}
      </span>
    </div>
  )
}

export default function ComparisonIllustration() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Traditional */}
      <div className="passport-card p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-[#5271ff]/10 text-primary-70 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-[#5271ff]" aria-hidden="true" />
          </span>
          <div>
            <p className="font-heading text-sm font-semibold text-[#5271ff]">Traditional System</p>
            <p className="text-xs text-secondary">Established credit signals</p>
          </div>
        </div>
        <div className="space-y-1">
          {traditional.map((row) => (
            <Row key={row.label} row={row} />
          ))}
        </div>
      </div>

      {/* Crypto User */}
      <div className="passport-card p-6 relative overflow-hidden">
        <span className="absolute right-4 top-4 bg-[#5271ff]/10 rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-accent">
          Untapped
        </span>
        <div className="mb-5 flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-[#5271ff]/10 text-accent flex items-center justify-center">
            <Wallet className="w-5 h-5" aria-hidden="true" />
          </span>
          <div>
            <p className="font-heading text-sm font-semibold text-[#5271ff]">Crypto User</p>
            <p className="text-xs text-secondary">Real wealth, no credit</p>
          </div>
        </div>
        <div className="space-y-1">
          {crypto.map((row) => (
            <Row key={row.label} row={row} />
          ))}
        </div>
      </div>
    </div>
  )
}
