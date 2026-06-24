import { Check, X } from 'lucide-react'

export default function LenderViewComparison() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Lender sees */}
      <div
        className="rounded-xl p-6"
        style={{
          background: 'var(--bg-surface)',
        }}
      >
        <div className="flex items-center gap-2 mb-5">
          {/* <span className="w-6 h-6 rounded-full bg-success-20 flex items-center justify-center shrink-0">
            <Check className="w-3.5 h-3.5 text-success" strokeWidth={3} aria-hidden="true" />
          </span> */}
          <p className="text-lg font-semibold font-heading text-success">
            What The Lender Sees
          </p>
        </div>
        <div className="space-y-3">
          {[
            'Passport Verified',
            'Gold Tier',
            'Financial Health Verified',
            'Proof Valid',
            'Stellar Verified',
          ].map((item) => (
            <div key={item} className="flex items-center gap-3 text-sm">
              <span className="w-5 h-5 rounded-full bg-success-20 flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 text-success" strokeWidth={3} aria-hidden="true" />
              </span>
              <span className="text-primary-50">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* User keeps private */}
      <div
        className="rounded-xl p-6"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
        }}
      >
        <div className="flex items-center gap-2 mb-5">
          {/* <span className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <X className="w-3.5 h-3.5 text-red-400" strokeWidth={3} aria-hidden="true" />
          </span> */}
          <p className="text-lg text-red-400 font-semibold font-heading">
            What Stays Private
          </p>
        </div>
        <div className="space-y-3">
          {[
            'Wallet Addresses',
            'Asset Balances',
            'Transaction History',
            'Portfolio Composition',
          ].map((item) => (
            <div key={item} className="flex items-center gap-3 text-sm">
              <span className="w-5 h-5 rounded-full bg-red-400/20 flex items-center justify-center shrink-0">
                <X className="w-3.5 h-3.5 text-red-400" strokeWidth={3} aria-hidden="true" />
              </span>
              <span className="text-primary-50">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
