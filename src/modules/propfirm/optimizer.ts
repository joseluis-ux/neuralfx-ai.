/**
 * Prop Firm Optimizer Module
 * Adjusts strategy parameters and risk to pass FTMO / The5ers style challenges
 */

import { StrategyGraph, RiskConfig, GenerationRequest } from "../../types";

export interface PropFirmRules {
  name: string;
  maxDailyLoss: number;
  maxTotalLoss: number;
  profitTarget: number;
  minTradingDays: number;
  maxLotMultiplier?: number;
  consistencyRule?: boolean;
  newsTradingAllowed: boolean;
  weekendHolding: boolean;
}

export const FIRM_RULES: Record<string, PropFirmRules> = {
  FTMO: {
    name: "FTMO",
    maxDailyLoss: 5,
    maxTotalLoss: 10,
    profitTarget: 10,
    minTradingDays: 4,
    consistencyRule: true,
    newsTradingAllowed: false,
    weekendHolding: true,
  },
  The5ers: {
    name: "The5ers",
    maxDailyLoss: 5,
    maxTotalLoss: 10,
    profitTarget: 6,
    minTradingDays: 3,
    consistencyRule: false,
    newsTradingAllowed: true,
    weekendHolding: true,
  },
  MyForexFunds: {
    name: "MyForexFunds",
    maxDailyLoss: 5,
    maxTotalLoss: 12,
    profitTarget: 8,
    minTradingDays: 5,
    consistencyRule: true,
    newsTradingAllowed: false,
    weekendHolding: false,
  },
  TrueForexFunds: {
    name: "True Forex Funds",
    maxDailyLoss: 5,
    maxTotalLoss: 10,
    profitTarget: 8,
    minTradingDays: 5,
    consistencyRule: true,
    newsTradingAllowed: false,
    weekendHolding: true,
  },
  Generic: {
    name: "Generic Prop",
    maxDailyLoss: 4,
    maxTotalLoss: 8,
    profitTarget: 8,
    minTradingDays: 5,
    consistencyRule: true,
    newsTradingAllowed: false,
    weekendHolding: true,
  },
};

export function optimizeForPropFirm(
  request: GenerationRequest,
  firmKey: string = "FTMO"
): GenerationRequest {
  const firm = FIRM_RULES[firmKey] || FIRM_RULES.Generic;

  const optimized: GenerationRequest = {
    ...request,
    propFirmMode: true,
    firm: firmKey as any,
    riskLevel: "Conservative",
    includeTrailing: true,
    includeNewsFilter: !firm.newsTradingAllowed,
  };

  return optimized;
}

export function suggestRiskConfig(firmKey: string = "FTMO"): RiskConfig {
  const firm = FIRM_RULES[firmKey] || FIRM_RULES.Generic;

  return {
    riskPerTrade: 0.5,
    maxDailyLoss: Math.min(firm.maxDailyLoss - 1, 3),
    maxTotalLoss: Math.min(firm.maxTotalLoss - 2, 6),
    maxOpenTrades: 2,
    useTrailingStop: true,
    trailingStartATR: 1.0,
    trailingStepATR: 0.5,
    breakEvenATR: 0.8,
    maxSpreadPoints: 20,
  };
}

export function generatePropFirmReport(profile: any, firmKey: string): string {
  const firm = FIRM_RULES[firmKey] || FIRM_RULES.Generic;

  return `
# Prop Firm Readiness Report — ${firm.name}

## Target Rules
- Max Daily Loss: ${firm.maxDailyLoss}%
- Max Total Loss: ${firm.maxTotalLoss}%
- Profit Target: ${firm.profitTarget}%
- Min Trading Days: ${firm.minTradingDays}
- Consistency Rule: ${firm.consistencyRule ? "Yes" : "No"}
- News Trading: ${firm.newsTradingAllowed ? "Allowed" : "Restricted"}

## Strategy Profile Match
- Robustness: ${profile.robustness}/100
- Risk Score: ${profile.riskScore}/100 (lower is safer)
- Prop Firm Ready: ${profile.propFirmReady ? "✅ YES" : "❌ Needs adjustment"}

## Recommendations
${(profile.recommendations || []).map((r: string) => `- ${r}`).join("\n")}

## Suggested Risk Settings
- Risk per trade: 0.4 – 0.7%
- Max daily loss hard stop: ${Math.min(firm.maxDailyLoss - 1, 3)}%
- Max open trades: 1-2
- Prefer H1 / H4 timeframes for consistency
`.trim();
}
