"use client";

import { useState } from "react";
import { StrategyGenerator } from "@/modules/generator";
import { optimizeForPropFirm } from "@/modules/propfirm/optimizer";
import { useStrategyStore } from "@/lib/store";
import type { GeneratedEA, BotProfile, GenerationRequest } from "@/types";

export function useStrategyGenerator() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ea, setEa] = useState<GeneratedEA | null>(null);
  const [profile, setProfile] = useState<BotProfile | null>(null);

  async function generate(partial: Partial<GenerationRequest> = {}) {
    setLoading(true);
    setError(null);

    try {
      const provider = (localStorage.getItem("neuralfx_provider") as any) || "demo";
      const apiKey = localStorage.getItem("neuralfx_api_key") || undefined;

      const generator = new StrategyGenerator({
        provider,
        apiKey,
      });

      const request = optimizeForPropFirm(
        {
          prompt: partial.prompt || "Estrategia EMA + RSI + ATR optimizada para Prop Firm",
          style: partial.style || "Intraday",
          timeframe: partial.timeframe || "H1",
          markets: partial.markets || ["Forex"],
          propFirmMode: true,
          firm: partial.firm || "FTMO",
          mqlVersion: partial.mqlVersion || "MQL5",
          includeTrailing: true,
          language: "es",
          ...partial,
        },
        partial.firm || "FTMO"
      );

      const result = await generator.generate(request);
      const botProfile = await generator.analyzeProfile(result.code, "es");

      setEa(result);
      setProfile(botProfile);

      // Guardar automáticamente en el store
      try {
        const addStrategy = useStrategyStore.getState().addStrategy;
        addStrategy({
          name: (result as any).strategyName || result.filename,
          code: result.code,
          filename: result.filename,
          mqlVersion: (result as any).mqlVersion || "MQL5",
          profile: botProfile,
          features: (result as any).features || [],
          warnings: (result as any).warnings || [],
          prompt: request.prompt,
        });
      } catch (e) {
        // ignore store errors
        console.warn("Could not persist strategy:", e);
      }

      return { ea: result, profile: botProfile };
    } catch (err: any) {
      const msg = err?.message || "Error generando estrategia";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return { loading, error, ea, profile, generate, setEa, setProfile };
}
