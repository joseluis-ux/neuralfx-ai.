"use client";

import { useState } from "react";
import { useStrategyGenerator } from "@/hooks/useStrategyGenerator";
import ApiKeyModal from "@/components/ApiKeyModal";

export default function GenerateSection() {
  const [prompt, setPrompt] = useState("");
  const [showKeys, setShowKeys] = useState(false);
  const { loading, error, ea, profile, generate } = useStrategyGenerator();

  const handleGenerate = async () => {
    await generate({
      prompt: prompt || "Estrategia de cruce de EMAs con RSI y stops ATR para FTMO",
      style: "Intraday",
      timeframe: "H1",
      propFirmMode: true,
      firm: "FTMO",
      mqlVersion: "MQL5",
      language: "es",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => setShowKeys(true)}
          className="rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
        >
          ⚙ API Keys
        </button>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="rounded-lg bg-cyan-500 px-4 py-2 font-semibold text-black hover:bg-cyan-400 disabled:opacity-50"
        >
          {loading ? "Generando..." : "🤖 IA Generar"}
        </button>
      </div>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe la estrategia que quieres (opcional)"
        className="w-full rounded-lg border border-slate-600 bg-slate-900 p-3 text-white"
        rows={3}
      />

      {error && <p className="text-sm text-red-400">{error}</p>}

      {ea && (
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-semibold text-white">{ea.filename}</h3>
            <button
              onClick={() => navigator.clipboard.writeText(ea.code)}
              className="text-sm text-cyan-400 hover:underline"
            >
              Copiar código
            </button>
          </div>
          <pre className="max-h-96 overflow-auto rounded bg-black/50 p-3 text-xs text-green-300">
            {ea.code}
          </pre>
          {ea.features?.length > 0 && (
            <p className="mt-2 text-xs text-slate-400">
              Features: {ea.features.join(" · ")}
            </p>
          )}
        </div>
      )}

      {profile && (
        <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-700 bg-slate-900 p-4 md:grid-cols-4">
          <div>
            <p className="text-xs text-slate-400">Robustez</p>
            <p className="text-xl font-bold text-white">{profile.robustness}%</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Hurst</p>
            <p className="text-xl font-bold text-white">
              {profile.hurstExponent} ({profile.hurstLabel})
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Prop Firm</p>
            <p className="text-xl font-bold text-white">
              {profile.propFirmReady ? "✅ Listo" : "⚠️ Revisar"}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Riesgo</p>
            <p className="text-xl font-bold text-white">{profile.riskScore}%</p>
          </div>
          <p className="col-span-full text-sm text-slate-300">{profile.summary}</p>
        </div>
      )}

      <ApiKeyModal open={showKeys} onClose={() => setShowKeys(false)} />
    </div>
  );
}
