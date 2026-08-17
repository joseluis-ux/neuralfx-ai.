/**
 * NeuralFX Advanced - Core Type Definitions
 * Production-grade types for Strategy Generator, Bot Profile & Prop Firm modules
 */

export type Timeframe = "M1" | "M5" | "M15" | "M30" | "H1" | "H4" | "D1" | "W1";
export type MarketType = "Forex" | "Indices" | "Metals" | "Stocks" | "Commodities" | "Crypto";
export type StrategyStyle = "Scalping" | "Intraday" | "Swing" | "Position";
export type Regime = "TrendFollowing" | "MeanReversion" | "Breakout" | "Momentum" | "Volatility";

export interface RiskConfig {
  riskPerTrade: number;
  maxDailyLoss: number;
  maxTotalLoss: number;
  maxOpenTrades: number;
  useTrailingStop: boolean;
  trailingStartATR: number;
  trailingStepATR: number;
  breakEvenATR: number;
  maxSpreadPoints: number;
}

export interface SessionFilter {
  london: boolean;
  newYork: boolean;
  tokyo: boolean;
  sydney: boolean;
  avoidNews: boolean;
  customHours?: { start: string; end: string }[];
}

export interface IndicatorNode {
  id: string;
  type: string;
  params: Record<string, number | string | boolean>;
  outputs: string[];
}

export interface SignalNode {
  id: string;
  type: "EntryLong" | "EntryShort" | "ExitLong" | "ExitShort" | "Filter";
  conditions: Condition[];
  logic: "AND" | "OR";
}

export interface Condition {
  left: string;
  operator: ">" | "<" | ">=" | "<=" | "==" | "crosses_above" | "crosses_below";
  right: string | number;
}

export interface StrategyGraph {
  id: string;
  name: string;
  description: string;
  timeframe: Timeframe;
  markets: MarketType[];
  style: StrategyStyle;
  indicators: IndicatorNode[];
  signals: SignalNode[];
  risk: RiskConfig;
  sessions: SessionFilter;
  magicNumber: number;
  version: string;
  createdAt: string;
  updatedAt: string;
}

export interface BotProfile {
  robustness: number;
  complexity: number;
  trendAffinity: number;
  riskScore: number;
  hurstExponent: number;
  hurstLabel: "MeanReverting" | "Random" | "Trending";
  confidence: number;
  regimeScores: Record<Regime, number>;
  frequencyScores: {
    scalping: number;
    intraday: number;
    swing: number;
  };
  marketCompatibility: Record<MarketType, number>;
  propFirmReady: boolean;
  propFirmChecks: {
    maxDailyLoss: { value: number; status: "Safe" | "Warning" | "Fail" };
    maxTotalLoss: { value: number; status: "Safe" | "Warning" | "Fail" };
    profitTarget: { value: number; status: "Realistic" | "Aggressive" | "Unrealistic" };
    minTradingDays: { value: number; status: "Ok" | "Low" };
  };
  compatibleFirms: string[];
  summary: string;
  recommendations: string[];
}

export interface GeneratedEA {
  mqlVersion: "MQL4" | "MQL5";
  code: string;
  filename: string;
  strategyName: string;
  inputs: { name: string; type: string; default: string | number; description: string }[];
  features: string[];
  warnings: string[];
}

export interface GenerationRequest {
  prompt?: string;
  graph?: StrategyGraph;
  style?: StrategyStyle;
  timeframe?: Timeframe;
  markets?: MarketType[];
  riskLevel?: "Conservative" | "Balanced" | "Aggressive";
  propFirmMode?: boolean;
  firm?: "FTMO" | "The5ers" | "MyForexFunds" | "TrueForexFunds" | "Generic";
  mqlVersion?: "MQL4" | "MQL5";
  includeNewsFilter?: boolean;
  includeTrailing?: boolean;
  language?: "es" | "en";
}

export interface AIProviderConfig {
  provider:
    | "anthropic"
    | "openai"
    | "grok"
    | "groq"
    | "gemini"
    | "kimi"
    | "together"
    | "openrouter"
    | "demo";
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  baseURL?: string;
}
