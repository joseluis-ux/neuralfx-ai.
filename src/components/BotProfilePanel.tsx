"use client";

import type { BotProfile } from "@/types";

interface Props {
  profile: BotProfile | null;
  onOptimize?: () => void;
}

function Bar({ label, value, color = "bg-cyan-500" }: { label: string; value: number; color?: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className="font-medium text-white">{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, value)}%` }} />
      </div>
    </div>
  );
}

export default function BotProfilePanel({ profile, onOptimize }: Props) {
  if (!profile) {
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6 text-center text-slate-500">
        Genera una estrategia para ver el perfil del bot
      </div>
    );
  }

  const regimeEntries = Object.entries(profile.regimeScores || {});
  const marketEntries = Object.entries(profile.marketCompatibility || {});

  return (
    <div className="space-y-5 rounded-xl border border-slate-700 bg-slate-900 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">Perfil del Bot</h3>
        {profile.propFirmReady ? (
          <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-400">
            Prop Firm Ready
          </span>
        ) : (
          <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-medium text-amber-400">
            Revisar riesgo
          </span>
        )}
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-lg bg-slate-800/80 p-3">
          <p className="text-xs text-slate-400">Robustez</p>
          <p className="text-2xl font-bold text-white">{profile.robustness}%</p>
        </div>
        <div className="rounded-lg bg-slate-800/80 p-3">
          <p className="text-xs text-slate-400">Complejidad</p>
          <p className="text-2xl font-bold text-white">{profile.complexity}%</p>
        </div>
        <div className="rounded-lg bg-slate-800/80 p-3">
          <p className="text-xs text-slate-400">Hurst</p>
          <p className="text-2xl font-bold text-white">{profile.hurstExponent}</p>
          <p className="text-xs text-slate-400">{profile.hurstLabel}</p>
        </div>
        <div className="rounded-lg bg-slate-800/80 p-3">
          <p className="text-xs text-slate-400">Riesgo</p>
          <p className="text-2xl font-bold text-white">{profile.riskScore}%</p>
        </div>
      </div>

      {/* Barras */}
      <div className="grid gap-3 md:grid-cols-2">
        <Bar label="Tendencia" value={profile.trendAffinity} color="bg-blue-500" />
        <Bar label="Confianza" value={profile.confidence} color="bg-violet-500" />
      </div>

      {/* Régimen de mercado */}
      <div>
        <p className="mb-2 text-sm font-medium text-slate-300">Régimen de Mercado</p>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {regimeEntries.map(([key, val]) => (
            <div key={key} className="rounded-lg bg-slate-800/60 px-3 py-2">
              <p className="text-xs text-slate-400">{key}</p>
              <p className="font-semibold text-white">{val}/100</p>
            </div>
          ))}
        </div>
      </div>

      {/* Frecuencia */}
      <div>
        <p className="mb-2 text-sm font-medium text-slate-300">Frecuencia Operativa</p>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-slate-800/60 px-3 py-2 text-center">
            <p className="text-xs text-slate-400">Scalping</p>
            <p className="font-semibold text-white">{profile.frequencyScores?.scalping ?? 0}</p>
          </div>
          <div className="rounded-lg bg-slate-800/60 px-3 py-2 text-center">
            <p className="text-xs text-slate-400">Intradía</p>
            <p className="font-semibold text-white">{profile.frequencyScores?.intraday ?? 0}</p>
          </div>
          <div className="rounded-lg bg-slate-800/60 px-3 py-2 text-center">
            <p className="text-xs text-slate-400">Swing</p>
            <p className="font-semibold text-white">{profile.frequencyScores?.swing ?? 0}</p>
          </div>
        </div>
      </div>

      {/* Compatibilidad de mercado */}
      <div>
        <p className="mb-2 text-sm font-medium text-slate-300">Compatibilidad de Mercado</p>
        <div className="flex flex-wrap gap-2">
          {marketEntries.map(([key, val]) => (
            <span
              key={key}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                val >= 80
                  ? "bg-emerald-500/20 text-emerald-400"
                  : val >= 50
                  ? "bg-slate-700 text-slate-300"
                  : "bg-slate-800 text-slate-500"
              }`}
            >
              {key} {val}%
            </span>
          ))}
        </div>
      </div>

      {/* Prop Firm checks */}
      <div>
        <p className="mb-2 text-sm font-medium text-slate-300">Prop Firm Challenge</p>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between rounded-lg bg-slate-800/60 px-3 py-2">
            <span className="text-slate-400">Max Daily Loss</span>
            <span className="text-white">
              {profile.propFirmChecks?.maxDailyLoss?.value}% · {profile.propFirmChecks?.maxDailyLoss?.status}
            </span>
          </div>
          <div className="flex justify-between rounded-lg bg-slate-800/60 px-3 py-2">
            <span className="text-slate-400">Max Total Loss</span>
            <span className="text-white">
              {profile.propFirmChecks?.maxTotalLoss?.value}% · {profile.propFirmChecks?.maxTotalLoss?.status}
            </span>
          </div>
          <div className="flex justify-between rounded-lg bg-slate-800/60 px-3 py-2">
            <span className="text-slate-400">Profit Target</span>
            <span className="text-white">
              {profile.propFirmChecks?.profitTarget?.value}% · {profile.propFirmChecks?.profitTarget?.status}
            </span>
          </div>
          <div className="flex justify-between rounded-lg bg-slate-800/60 px-3 py-2">
            <span className="text-slate-400">Min Days</span>
            <span className="text-white">
              {profile.propFirmChecks?.minTradingDays?.value} · {profile.propFirmChecks?.minTradingDays?.status}
            </span>
          </div>
        </div>
        {profile.compatibleFirms?.length > 0 && (
          <p className="mt-2 text-xs text-slate-400">
            Compatible con: {profile.compatibleFirms.join(", ")}
          </p>
        )}
      </div>

      {/* Summary + recomendaciones */}
      <div className="rounded-lg border border-slate-700 bg-slate-800/40 p-3">
        <p className="text-sm text-slate-200">{profile.summary}</p>
        {profile.recommendations?.length > 0 && (
          <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-slate-400">
            {profile.recommendations.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        )}
      </div>

      {onOptimize && (
        <button
          onClick={onOptimize}
          className="w-full rounded-lg bg-cyan-500/20 py-2 text-sm font-medium text-cyan-400 hover:bg-cyan-500/30"
        >
          Optimizar para Prop Firm
        </button>
      )}
    </div>
  );
}
