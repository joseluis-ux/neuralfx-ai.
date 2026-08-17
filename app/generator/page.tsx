"use client";

import { useState } from "react";
import { useStrategyGenerator } from "@/hooks/useStrategyGenerator";
import { useStrategyStore } from "@/lib/store";
import ApiKeyModal from "@/components/ApiKeyModal";
import BotProfilePanel from "@/components/BotProfilePanel";
import SavedStrategies from "@/components/SavedStrategies";

export default function GeneratorPage() {
  const [prompt, setPrompt] = useState("");
  const [showKeys, setShowKeys] = useState(false);
  const { loading, error, ea, profile, generate, setEa, setProfile } = useStrategyGenerator();
  const addStrategy = useStrategyStore((s) => s.addStrategy);

  const handleGenerate = async () => {
    const result = await generate({
      prompt: prompt || "Estrategia EMA + RSI + ATR optimizada para FTMO",
      style: "Intraday",
      timeframe: "H1",
      propFirmMode: true,
      firm: "FTMO",
      mqlVersion: "MQL5",
      language: "es",
    });

    if (result?.ea) {
      addStrategy({
        name: result.ea.strategyName || result.ea.filename,
        code: result.ea.code,
        filename: result.ea.filename,
        mqlVersion: result.ea.mqlVersion,
        profile: result.profile,
        features: result.ea.features || [],
        warnings: result.ea.warnings || [],
        prompt,
      });
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => setShowKeys(true)}
          className="rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-300"
        >
          ⚙ API Keys
        </button>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="rounded-lg bg-cyan-500 px-5 py-2 font-semibold text-black disabled:opacity-50"
        >
          {loading ? "Generando..." : "🤖 IA Generar"}
        </button>
      </div>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe tu estrategia..."
        className="w-full rounded-lg border border-slate-600 bg-slate-900 p-3 text-white"
        rows={3}
      />

      {error && <p className="text-red-400">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          {ea && (
            <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
              <div className="mb-2 flex justify-between">
                <h3 className="font-semibold text-white">{ea.filename}</h3>
                <button
                  onClick={() => navigator.clipboard.writeText(ea.code)}
                  className="text-sm text-cyan-400"
                >
                  Copiar
                </button>
              </div>
              <pre className="max-h-96 overflow-auto text-xs text-green-300">{ea.code}</pre>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <BotProfilePanel profile={profile} />
          <SavedStrategies
            onLoad={(code, prof) => {
              setEa({
                code,
                filename: "loaded.mq5",
                strategyName: "Loaded",
                mqlVersion: "MQL5",
                inputs: [],
                features: [],
                warnings: [],
              });
              setProfile(prof);
            }}
          />
        </div>
      </div>

      <ApiKeyModal open={showKeys} onClose={() => setShowKeys(false)} />
    </div>
  );
}
