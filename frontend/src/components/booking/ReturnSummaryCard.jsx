import React from 'react';
import { ShieldCheck, AlertCircle, Banknote, FileText, Image as ImageIcon } from 'lucide-react';

export const ReturnSummaryCard = ({ summary, damageReport }) => {
  if (!summary && !damageReport) return null;

  const deposit = summary?.originalDeposit ?? damageReport?.depositAmount ?? 0;
  const deduction = summary?.damageDeduction ?? damageReport?.damageAmount ?? 0;
  const refund = summary?.finalRefund ?? damageReport?.refundAmount ?? 0;
  const status = summary?.bookingStatus || damageReport?.status || 'COMPLETED';

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white">Rental Return & Deposit Summary</h4>
            <p className="text-xs text-slate-400">Financial breakdown and refund status</p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-semibold text-xs">
          {status}
        </span>
      </div>

      {/* Financial Breakdown Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80">
          <span className="text-xs text-slate-400 font-medium block mb-1">Original Deposit</span>
          <span className="text-lg font-extrabold text-white">₹{deposit}</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80">
          <span className="text-xs text-slate-400 font-medium block mb-1">Damage Deduction</span>
          <span className={`text-lg font-extrabold ${deduction > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
            - ₹{deduction}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/50">
          <span className="text-xs text-emerald-400 font-medium block mb-1">Final Refund Amount</span>
          <span className="text-xl font-extrabold text-emerald-300">₹{refund}</span>
        </div>
      </div>

      {/* Damage Notes if present */}
      {damageReport?.description && (
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
            <FileText className="w-4 h-4 text-amber-400" />
            <span>Inspection Notes:</span>
          </div>
          <p className="text-xs text-slate-400 pl-6 leading-relaxed">
            {damageReport.description}
          </p>
        </div>
      )}

      {/* Evidences if present */}
      {damageReport?.evidences && damageReport.evidences.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
            <ImageIcon className="w-4 h-4 text-brand-400" />
            <span>Damage Evidence Photos:</span>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {damageReport.evidences.map((ev, i) => (
              <a
                key={i}
                href={ev.imageUrl}
                target="_blank"
                rel="noreferrer"
                className="block group relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950"
              >
                <img
                  src={ev.imageUrl}
                  alt={`Evidence ${i + 1}`}
                  className="w-20 h-20 object-cover group-hover:scale-105 transition-transform"
                />
              </a>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
