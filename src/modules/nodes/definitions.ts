/**
 * Node definitions for the visual strategy builder
 * Compatible with React Flow / the current NeuralFX canvas
 */

export type NodeCategory = "indicator" | "signal" | "risk" | "filter" | "action" | "data";

export interface NodeDefinition {
  type: string;
  label: string;
  category: NodeCategory;
  description: string;
  inputs: { id: string; label: string; type: "number" | "boolean" | "series" | "any" }[];
  outputs: { id: string; label: string; type: "number" | "boolean" | "series" | "signal" }[];
  params: {
    name: string;
    label: string;
    type: "number" | "string" | "boolean" | "select";
    default: any;
    options?: string[];
    min?: number;
    max?: number;
    step?: number;
  }[];
  color: string;
}

export const NODE_LIBRARY: NodeDefinition[] = [
  {
    type: "EMA",
    label: "EMA",
    category: "indicator",
    description: "Exponential Moving Average",
    inputs: [{ id: "price", label: "Price", type: "series" }],
    outputs: [{ id: "value", label: "EMA", type: "series" }],
    params: [
      { name: "period", label: "Period", type: "number", default: 20, min: 2, max: 500 },
      { name: "priceType", label: "Price", type: "select", default: "close", options: ["close", "open", "high", "low", "median"] },
    ],
    color: "#3b82f6",
  },
  {
    type: "RSI",
    label: "RSI",
    category: "indicator",
    description: "Relative Strength Index",
    inputs: [{ id: "price", label: "Price", type: "series" }],
    outputs: [{ id: "value", label: "RSI", type: "series" }],
    params: [
      { name: "period", label: "Period", type: "number", default: 14, min: 2, max: 100 },
      { name: "overbought", label: "Overbought", type: "number", default: 70 },
      { name: "oversold", label: "Oversold", type: "number", default: 30 },
    ],
    color: "#8b5cf6",
  },
  {
    type: "ATR",
    label: "ATR",
    category: "indicator",
    description: "Average True Range – for dynamic stops",
    inputs: [],
    outputs: [{ id: "value", label: "ATR", type: "series" }],
    params: [{ name: "period", label: "Period", type: "number", default: 14, min: 1, max: 100 }],
    color: "#f59e0b",
  },
  {
    type: "MACD",
    label: "MACD",
    category: "indicator",
    description: "Moving Average Convergence Divergence",
    inputs: [{ id: "price", label: "Price", type: "series" }],
    outputs: [
      { id: "main", label: "MACD", type: "series" },
      { id: "signal", label: "Signal", type: "series" },
      { id: "hist", label: "Histogram", type: "series" },
    ],
    params: [
      { name: "fast", label: "Fast", type: "number", default: 12 },
      { name: "slow", label: "Slow", type: "number", default: 26 },
      { name: "signal", label: "Signal", type: "number", default: 9 },
    ],
    color: "#06b6d4",
  },
  {
    type: "Bollinger",
    label: "Bollinger Bands",
    category: "indicator",
    description: "Bollinger Bands",
    inputs: [{ id: "price", label: "Price", type: "series" }],
    outputs: [
      { id: "upper", label: "Upper", type: "series" },
      { id: "middle", label: "Middle", type: "series" },
      { id: "lower", label: "Lower", type: "series" },
    ],
    params: [
      { name: "period", label: "Period", type: "number", default: 20 },
      { name: "deviation", label: "Deviation", type: "number", default: 2, step: 0.1 },
    ],
    color: "#ec4899",
  },
  {
    type: "Supertrend",
    label: "Supertrend",
    category: "indicator",
    description: "Supertrend indicator",
    inputs: [],
    outputs: [
      { id: "value", label: "Supertrend", type: "series" },
      { id: "direction", label: "Direction", type: "series" },
    ],
    params: [
      { name: "period", label: "ATR Period", type: "number", default: 10 },
      { name: "multiplier", label: "Multiplier", type: "number", default: 3, step: 0.1 },
    ],
    color: "#10b981",
  },
  {
    type: "CrossAbove",
    label: "Cruce Alcista",
    category: "signal",
    description: "Señal cuando A cruza por encima de B",
    inputs: [
      { id: "a", label: "Serie A", type: "series" },
      { id: "b", label: "Serie B", type: "series" },
    ],
    outputs: [{ id: "signal", label: "Signal", type: "signal" }],
    params: [],
    color: "#22c55e",
  },
  {
    type: "CrossBelow",
    label: "Cruce Bajista",
    category: "signal",
    description: "Señal cuando A cruza por debajo de B",
    inputs: [
      { id: "a", label: "Serie A", type: "series" },
      { id: "b", label: "Serie B", type: "series" },
    ],
    outputs: [{ id: "signal", label: "Signal", type: "signal" }],
    params: [],
    color: "#ef4444",
  },
  {
    type: "Threshold",
    label: "Umbral",
    category: "signal",
    description: "Señal cuando valor cruza un nivel",
    inputs: [{ id: "value", label: "Value", type: "series" }],
    outputs: [{ id: "signal", label: "Signal", type: "signal" }],
    params: [
      { name: "level", label: "Level", type: "number", default: 70 },
      { name: "direction", label: "Direction", type: "select", default: "above", options: ["above", "below"] },
    ],
    color: "#a855f7",
  },
  {
    type: "RiskPercent",
    label: "Riesgo %",
    category: "risk",
    description: "Calcula lotaje por % del equity",
    inputs: [{ id: "slDistance", label: "SL Distance", type: "number" }],
    outputs: [{ id: "lots", label: "Lots", type: "number" }],
    params: [
      { name: "percent", label: "Risk %", type: "number", default: 0.5, min: 0.1, max: 5, step: 0.1 },
    ],
    color: "#f97316",
  },
  {
    type: "ATRStops",
    label: "Stops ATR",
    category: "risk",
    description: "Stop Loss y Take Profit dinámicos con ATR",
    inputs: [{ id: "atr", label: "ATR", type: "series" }],
    outputs: [
      { id: "sl", label: "Stop Loss", type: "number" },
      { id: "tp", label: "Take Profit", type: "number" },
    ],
    params: [
      { name: "slMult", label: "SL Multiplier", type: "number", default: 1.5, step: 0.1 },
      { name: "tpMult", label: "TP Multiplier", type: "number", default: 2.5, step: 0.1 },
    ],
    color: "#eab308",
  },
  {
    type: "TrailingStop",
    label: "Trailing Stop",
    category: "risk",
    description: "Trailing stop + Break-Even",
    inputs: [],
    outputs: [],
    params: [
      { name: "startATR", label: "Start (ATR)", type: "number", default: 1.0, step: 0.1 },
      { name: "stepATR", label: "Step (ATR)", type: "number", default: 0.5, step: 0.1 },
      { name: "useBE", label: "Break-Even", type: "boolean", default: true },
      { name: "beATR", label: "BE Trigger (ATR)", type: "number", default: 0.8, step: 0.1 },
    ],
    color: "#84cc16",
  },
  {
    type: "SessionFilter",
    label: "Filtro de Sesión",
    category: "filter",
    description: "Solo opera en sesiones seleccionadas",
    inputs: [],
    outputs: [{ id: "allowed", label: "Allowed", type: "boolean" }],
    params: [
      { name: "london", label: "London", type: "boolean", default: true },
      { name: "newYork", label: "New York", type: "boolean", default: true },
      { name: "tokyo", label: "Tokyo", type: "boolean", default: false },
    ],
    color: "#64748b",
  },
  {
    type: "SpreadFilter",
    label: "Filtro de Spread",
    category: "filter",
    description: "Bloquea si el spread es demasiado alto",
    inputs: [],
    outputs: [{ id: "allowed", label: "Allowed", type: "boolean" }],
    params: [{ name: "maxPoints", label: "Max Spread (points)", type: "number", default: 25 }],
    color: "#64748b",
  },
  {
    type: "EntryLong",
    label: "Entrada Long",
    category: "action",
    description: "Abrir posición de compra",
    inputs: [
      { id: "signal", label: "Signal", type: "signal" },
      { id: "lots", label: "Lots", type: "number" },
      { id: "sl", label: "SL", type: "number" },
      { id: "tp", label: "TP", type: "number" },
    ],
    outputs: [],
    params: [],
    color: "#22c55e",
  },
  {
    type: "EntryShort",
    label: "Entrada Short",
    category: "action",
    description: "Abrir posición de venta",
    inputs: [
      { id: "signal", label: "Signal", type: "signal" },
      { id: "lots", label: "Lots", type: "number" },
      { id: "sl", label: "SL", type: "number" },
      { id: "tp", label: "TP", type: "number" },
    ],
    outputs: [],
    params: [],
    color: "#ef4444",
  },
];

export function getNodesByCategory(category: NodeCategory) {
  return NODE_LIBRARY.filter((n) => n.category === category);
}

export function getNodeDefinition(type: string) {
  return NODE_LIBRARY.find((n) => n.type === type);
}
