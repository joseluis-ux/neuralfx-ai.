"use client";

import { useStrategyStore } from "@/lib/store";

interface Props {
  onLoad?: (code: string, profile: any) => void;
}

export default function SavedStrategies({ onLoad }: Props) {
  const { strategies, removeStrategy, clearAll } = useStrategyStore();

  if (strategies.length === 0) {
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6 text-center text-slate-500">
        No hay estrategias guardadas todavía
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-white">Estrategias guardadas ({strategies.length})</h3>
        <button
          onClick={() => {
            if (confirm("¿Borrar todas las estrategias?")) clearAll();
          }}
          className="text-xs text-red-400 hover:underline"
        >
          Borrar todas
        </button>
      </div>

      <div className="max-h-80 space-y-2 overflow-y-auto">
        {strategies.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900 px-4 py-3"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-white">{s.name}</p>
              <p className="text-xs text-slate-400">
                {s.mqlVersion} · {new Date(s.createdAt).toLocaleString()} · Robustez {s.profile?.robustness ?? "—"}%
              </p>
            </div>
            <div className="ml-3 flex gap-2">
              {onLoad && (
                <button
                  onClick={() => onLoad(s.code, s.profile)}
                  className="rounded bg-cyan-500/20 px-2 py-1 text-xs text-cyan-400 hover:bg-cyan-500/30"
                >
                  Cargar
                </button>
              )}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(s.code);
                }}
                className="rounded bg-slate-700 px-2 py-1 text-xs text-slate-300 hover:bg-slate-600"
              >
                Copiar
              </button>
              <button
                onClick={() => removeStrategy(s.id)}
                className="rounded bg-red-500/20 px-2 py-1 text-xs text-red-400 hover:bg-red-500/30"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
