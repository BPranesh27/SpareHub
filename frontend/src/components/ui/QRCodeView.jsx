import React, { useState } from 'react';
import { Copy, Check, QrCode } from 'lucide-react';

export const QRCodeView = ({ value, size = 220, label }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateGrid = (str) => {
    const gridSize = 21;
    const grid = Array(gridSize).fill(false).map(() => Array(gridSize).fill(false));

    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }

    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        // Finder pattern top-left
        if (r < 7 && c < 7) {
          if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
            grid[r][c] = true;
          }
          continue;
        }
        // Finder pattern top-right
        if (r < 7 && c >= gridSize - 7) {
          const cRel = c - (gridSize - 7);
          if (r === 0 || r === 6 || cRel === 0 || cRel === 6 || (r >= 2 && r <= 4 && cRel >= 2 && cRel === 4)) {
            grid[r][c] = true;
          }
          continue;
        }
        // Finder pattern bottom-left
        if (r >= gridSize - 7 && c < 7) {
          const rRel = r - (gridSize - 7);
          if (rRel === 0 || rRel === 6 || c === 0 || c === 6 || (rRel >= 2 && rRel <= 4 && c >= 2 && c <= 4)) {
            grid[r][c] = true;
          }
          continue;
        }

        // Timing patterns
        if (r === 6 || c === 6) {
          grid[r][c] = (r + c) % 2 === 0;
          continue;
        }

        const cellHash = Math.abs(Math.sin((r * 31 + c * 17 + hash) * 9999));
        grid[r][c] = cellHash > 0.45;
      }
    }
    return grid;
  };

  const grid = generateGrid(value || '');
  const cellSize = size / 21;

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="bg-white p-4 rounded-2xl shadow-xl border border-slate-700/50 flex flex-col items-center space-y-2">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rounded-lg">
          {grid.map((row, rIdx) =>
            row.map((cell, cIdx) =>
              cell ? (
                <rect
                  key={`${rIdx}-${cIdx}`}
                  x={cIdx * cellSize}
                  y={rIdx * cellSize}
                  width={cellSize + 0.5}
                  height={cellSize + 0.5}
                  fill="#0F172A"
                />
              ) : null
            )
          )}
        </svg>
      </div>

      <div className="w-full max-w-sm space-y-1.5 text-center">
        {label && <p className="text-xs text-slate-400 font-medium">{label}</p>}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between space-x-2">
          <div className="flex items-center space-x-2 overflow-hidden px-1">
            <QrCode className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-mono text-xs font-bold text-slate-200 truncate">{value}</span>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition shrink-0"
            title="Copy Handover Token"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
