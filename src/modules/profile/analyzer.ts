/**
 * Deterministic Bot Profile Analyzer
 * Works without AI - extracts signals from code / description
 * Can be enhanced later with real backtest results
 */

import { BotProfile, Regime, MarketType } from "../../types";

export function analyzeProfileFromCode(codeOrDesc: string): BotProfile | null {
  const text = codeOrDesc.toLowerCase();

  const hasEMA = /ema|iMA|moving average/i.test(text);
  const hasRSI = /rsi|relative strength/i.test(text);
  const hasATR = /atr|average true range/i.test(text);
  const hasMACD = /macd/i.test(text);
  const hasBB = /bollinger|bands/i.test(text);
  const hasSupertrend = /supertrend/i.test(text);
  const hasICT = /order.?block|fvg|fair value|liquidity|smart money|ict/i.test(text);
  const hasTrailing = /trailing|trail/i.test(text);
  const hasBE = /break.?even|breakeven/i.test(text);
  const hasSession = /session|london|new.?york|tokyo|hour\(/i.test(text);
  const hasRiskPct = /risk.*%|percent|equity/i.test(text);
  const hasMartingale = /martingale|grid|average.?down|recovery/i.test(text);

  let robustness = 50;
  let complexity = 30;
  let trendAffinity = 50;
  let riskScore = 50;

  if (hasATR) { robustness += 12; complexity += 5; }
  if (hasRiskPct) { robustness += 15; riskScore -= 15; }
  if (hasTrailing) { robustness += 8; }
  if (hasBE) { robustness += 6; }
  if (hasSession) { robustness += 7; complexity += 4; }
  if (hasEMA || hasMACD) { trendAffinity += 20; }
  if (hasRSI) { complexity += 8; }
  if (hasICT) { complexity += 25; trendAffinity += 10; robustness += 5; }
  if (hasBB) { complexity += 10; }
  if (hasMartingale) { robustness -= 40; riskScore += 40; }

  robustness = clamp(robustness, 10, 95);
  complexity = clamp(complexity, 10, 95);
  trendAffinity = clamp(trendAffinity, 10, 95);
  riskScore = clamp(riskScore, 10, 95);

  let hurst = 0.5;
  if (trendAffinity > 70) hurst = 0.62 + (trendAffinity - 70) * 0.004;
  else if (trendAffinity < 40) hurst = 0.42 - (40 - trendAffinity) * 0.003;
  hurst = clamp(hurst, 0.35, 0.78);

  const hurstLabel = hurst > 0.55 ? "Trending" : hurst < 0.45 ? "MeanReverting" : "Random";

  const regimeScores: Record<Regime, number> = {
    TrendFollowing: Math.round(trendAffinity * 0.9),
    MeanReversion: Math.round((100 - trendAffinity) * 0.7),
    Breakout: hasBB || hasSupertrend ? 65 : 35,
    Momentum: hasMACD || hasRSI ? 55 : 30,
    Volatility: hasATR ? 40 : 20,
  };

  const frequencyScores = {
    scalping: /m1|m5|scalp/i.test(text) ? 70 : 15,
    intraday: /m15|m30|h1|intraday/i.test(text) ? 80 : 50,
    swing: /h4|d1|swing/i.test(text) ? 65 : 30,
  };

  const marketCompatibility: Record<MarketType, number> = {
    Forex: 95,
    Indices: hasATR ? 85 : 70,
    Metals: 80,
    Stocks: 55,
    Commodities: 70,
    Crypto: hasATR && hasSession ? 60 : 40,
  };

  const propFirmReady = !hasMartingale && riskScore < 55 && robustness > 55;

  const profile: BotProfile = {
    robustness: Math.round(robustness),
    complexity: Math.round(complexity),
    trendAffinity: Math.round(trendAffinity),
    riskScore: Math.round(riskScore),
    hurstExponent: Math.round(hurst * 100) / 100,
    hurstLabel: hurstLabel as any,
    confidence: 78,
    regimeScores,
    frequencyScores,
    marketCompatibility,
    propFirmReady,
    propFirmChecks: {
      maxDailyLoss: { value: 3, status: riskScore < 50 ? "Safe" : "Warning" },
      maxTotalLoss: { value: 6, status: "Safe" },
      profitTarget: { value: 8, status: "Realistic" },
      minTradingDays: { value: 5, status: "Ok" },
    },
    compatibleFirms: propFirmReady
      ? ["FTMO", "The5ers", "True Forex Funds", "FundedNext"]
      : ["The5ers (más flexible)"],
    summary: propFirmReady
      ? "Perfil robusto y controlado. Compatible con la mayoría de Prop Firms si se respetan los parámetros de riesgo."
      : "Perfil con mayor agresividad o complejidad. Revisar reglas de riesgo antes de challenge.",
    recommendations: buildRecommendations({
      hasATR, hasRiskPct, hasTrailing, hasSession, hasMartingale, robustness, complexity,
    }),
  };

  return profile;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function buildRecommendations(ctx: any): string[] {
  const recs: string[] = [];
  if (!ctx.hasATR) recs.push("Añadir stops basados en ATR para adaptabilidad a volatilidad");
  if (!ctx.hasRiskPct) recs.push("Implementar riesgo fijo % del equity (0.5-1% para Prop Firm)");
  if (!ctx.hasTrailing) recs.push("Considerar trailing stop para proteger beneficios");
  if (!ctx.hasSession) recs.push("Añadir filtro de sesiones (Londres + NY suele ser óptimo)");
  if (ctx.hasMartingale) recs.push("⚠️ Eliminar cualquier lógica de martingale/grid — incompatible con Prop Firms serias");
  if (ctx.complexity > 75) recs.push("Simplificar: demasiados filtros pueden reducir el edge por overfitting");
  if (ctx.robustness < 50) recs.push("Mejorar gestión de riesgo y filtros de entrada");
  if (recs.length === 0) recs.push("Estrategia bien estructurada. Proceder a backtest de al menos 2 años + walk-forward");
  return recs;
}
