/**
 * Advanced Prompt Engineering for NeuralFX Strategy Generator
 * Optimized for Claude, GPT-4o, Grok, Gemini, Kimi, Groq
 */

export const SYSTEM_PROMPT_ES = `Eres un experto quant developer especializado en Expert Advisors (EA) de MetaTrader 4 y 5, ICT/Smart Money Concepts, Price Action y gestión de riesgo profesional para Prop Firms (FTMO, The5ers, etc.).

REGLAS ESTRICTAS:
1. Genera SIEMPRE código MQL4 o MQL5 COMPLETO, compilable y profesional.
2. Incluye: OnInit, OnDeinit, OnTick, gestión de riesgo real (% equity), trailing stop, break-even, filtros de sesión, filtro de spread, magic number, comentarios claros.
3. Usa ATR para stops y targets dinámicos cuando sea posible.
4. NUNCA uses martingale, grid o averaging down. Solo riesgo fijo por operación.
5. Para Prop Firm mode: respeta Max Daily Loss, Max Total DD, y evita overtrading.
6. Estructura el código con secciones claras: Inputs, Variables globales, Funciones auxiliares, Lógica de entrada/salida.
7. Incluye protección contra requotes y errores de OrderSend.
8. Responde SOLO con el código MQL dentro de un bloque ```mql o el JSON estructurado cuando se pida perfil.

Cuando se pida generar estrategia:
- Analiza el prompt del usuario + grafo de nodos si se proporciona.
- Prioriza robustez sobre complejidad excesiva.
- Prefiere conceptos limpios: EMA cross + RSI filter + ATR stops, o ICT (Order Blocks, FVG, Liquidity) si se solicita.
`;

export const SYSTEM_PROMPT_EN = `You are an expert quant developer specialized in MetaTrader 4/5 Expert Advisors, ICT/Smart Money Concepts, Price Action and professional risk management for Prop Firms (FTMO, The5ers, etc.).

STRICT RULES:
1. ALWAYS generate COMPLETE, compilable and professional MQL4 or MQL5 code.
2. Include: OnInit, OnDeinit, OnTick, real equity % risk management, trailing stop, break-even, session filters, spread filter, magic number, clear comments.
3. Use ATR for dynamic stops and targets whenever possible.
4. NEVER use martingale, grid or averaging down. Fixed risk per trade only.
5. For Prop Firm mode: respect Max Daily Loss, Max Total DD, avoid overtrading.
6. Structure code with clear sections: Inputs, Global variables, Helper functions, Entry/Exit logic.
7. Include protection against requotes and OrderSend errors.
8. Respond ONLY with the MQL code inside a ```mql block or the structured JSON when profile is requested.
`;

export function buildGenerationPrompt(req: {
  prompt?: string;
  style?: string;
  timeframe?: string;
  markets?: string[];
  riskLevel?: string;
  propFirmMode?: boolean;
  firm?: string;
  mqlVersion?: "MQL4" | "MQL5";
  includeNewsFilter?: boolean;
  includeTrailing?: boolean;
  language?: "es" | "en";
  graphSummary?: string;
}): string {
  const lang = req.language || "es";
  const version = req.mqlVersion || "MQL5";

  let userPrompt = lang === "es"
    ? `Genera un Expert Advisor completo en ${version} con las siguientes especificaciones:\n\n`
    : `Generate a complete Expert Advisor in ${version} with the following specifications:\n\n`;

  if (req.prompt) {
    userPrompt += `Descripción del usuario:\n${req.prompt}\n\n`;
  }

  if (req.graphSummary) {
    userPrompt += `Grafo de nodos actual:\n${req.graphSummary}\n\n`;
  }

  userPrompt += `Estilo: ${req.style || "Intraday"}\n`;
  userPrompt += `Timeframe principal: ${req.timeframe || "H1"}\n`;
  userPrompt += `Mercados: ${(req.markets || ["Forex"]).join(", ")}\n`;
  userPrompt += `Nivel de riesgo: ${req.riskLevel || "Balanced"}\n`;
  userPrompt += `Trailing Stop: ${req.includeTrailing !== false ? "Sí" : "No"}\n`;
  userPrompt += `Filtro de noticias: ${req.includeNewsFilter ? "Sí (básico)" : "No"}\n`;

  if (req.propFirmMode) {
    userPrompt += `\nMODO PROP FIRM ACTIVADO (${req.firm || "Generic"}):\n`;
    userPrompt += `- Max Daily Loss estricto\n`;
    userPrompt += `- Max Total Drawdown respetado\n`;
    userPrompt += `- Evitar overtrading (máx 3-5 operaciones/día)\n`;
    userPrompt += `- Profit target realista (6-10%)\n`;
    userPrompt += `- Consistency rules friendly\n`;
  }

  userPrompt += `\nEntrega el código completo listo para copiar y compilar. Incluye todos los inputs necesarios y comentarios en ${lang === "es" ? "español" : "inglés"}.`;

  return userPrompt;
}

export const PROFILE_ANALYSIS_PROMPT = `Analiza la siguiente estrategia (código o descripción de nodos) y genera un perfil multidimensional en formato JSON estricto con esta estructura exacta:

{
  "robustness": 0-100,
  "complexity": 0-100,
  "trendAffinity": 0-100,
  "riskScore": 0-100,
  "hurstExponent": 0.0-1.0,
  "hurstLabel": "MeanReverting" | "Random" | "Trending",
  "confidence": 0-100,
  "regimeScores": {
    "TrendFollowing": 0-100,
    "MeanReversion": 0-100,
    "Breakout": 0-100,
    "Momentum": 0-100,
    "Volatility": 0-100
  },
  "frequencyScores": {
    "scalping": 0-100,
    "intraday": 0-100,
    "swing": 0-100
  },
  "marketCompatibility": {
    "Forex": 0-100,
    "Indices": 0-100,
    "Metals": 0-100,
    "Stocks": 0-100,
    "Commodities": 0-100,
    "Crypto": 0-100
  },
  "propFirmReady": true/false,
  "propFirmChecks": {
    "maxDailyLoss": { "value": number, "status": "Safe"|"Warning"|"Fail" },
    "maxTotalLoss": { "value": number, "status": "Safe"|"Warning"|"Fail" },
    "profitTarget": { "value": number, "status": "Realistic"|"Aggressive"|"Unrealistic" },
    "minTradingDays": { "value": number, "status": "Ok"|"Low" }
  },
  "compatibleFirms": ["FTMO", "The5ers", ...],
  "summary": "texto corto",
  "recommendations": ["rec1", "rec2", ...]
}

Sé realista y conservador. No inventes números altos sin justificación.`;
