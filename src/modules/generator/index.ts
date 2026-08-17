/**
 * NeuralFX Advanced Strategy Generator
 * Core module - produces high-quality MQL4/MQL5 Expert Advisors
 * Supports Anthropic, OpenAI, Grok, Groq, Gemini, Kimi, OpenRouter and Demo modes
 */

import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import {
  GenerationRequest,
  GeneratedEA,
  AIProviderConfig,
  StrategyGraph,
  BotProfile,
} from "../../types";
import {
  SYSTEM_PROMPT_ES,
  SYSTEM_PROMPT_EN,
  buildGenerationPrompt,
  PROFILE_ANALYSIS_PROMPT,
} from "../../prompts/strategy-prompts";
import { generateDemoEA } from "./demo-templates";
import { analyzeProfileFromCode } from "../profile/analyzer";

export class StrategyGenerator {
  private config: AIProviderConfig;

  constructor(config: AIProviderConfig = { provider: "demo" }) {
    this.config = {
      temperature: 0.35,
      maxTokens: 8192,
      ...config,
    };
  }

  async generate(request: GenerationRequest): Promise<GeneratedEA> {
    if (this.config.provider === "demo" || !this.config.apiKey) {
      return generateDemoEA(request);
    }

    const systemPrompt =
      request.language === "en" ? SYSTEM_PROMPT_EN : SYSTEM_PROMPT_ES;

    const userPrompt = buildGenerationPrompt({
      ...request,
      graphSummary: request.graph
        ? this.summarizeGraph(request.graph)
        : undefined,
    });

    let rawCode = "";

    try {
      if (this.config.provider === "anthropic") {
        rawCode = await this.callAnthropic(systemPrompt, userPrompt);
      } else if (
        this.config.provider === "openai" ||
        this.config.provider === "grok" ||
        this.config.provider === "groq" ||
        this.config.provider === "together" ||
        this.config.provider === "openrouter" ||
        this.config.provider === "gemini" ||
        this.config.provider === "kimi"
      ) {
        rawCode = await this.callOpenAICompatible(systemPrompt, userPrompt);
      } else {
        return generateDemoEA(request);
      }
    } catch (err: any) {
      console.error("AI generation failed, falling back to demo template:", err.message);
      return generateDemoEA(request);
    }

    const cleaned = this.extractMQLCode(rawCode);
    const mqlVersion = request.mqlVersion || "MQL5";
    const strategyName = this.extractStrategyName(cleaned) || "NeuralFX_Advanced_EA";

    return {
      mqlVersion,
      code: cleaned,
      filename: `${strategyName}.${mqlVersion === "MQL5" ? "mq5" : "mq4"}`,
      strategyName,
      inputs: this.extractInputs(cleaned),
      features: this.detectFeatures(cleaned),
      warnings: this.validateCode(cleaned, request),
    };
  }

  async analyzeProfile(
    codeOrDescription: string,
    language: "es" | "en" = "es"
  ): Promise<BotProfile> {
    const deterministic = analyzeProfileFromCode(codeOrDescription);
    if (deterministic && deterministic.confidence > 70) {
      return deterministic;
    }

    if (this.config.provider === "demo" || !this.config.apiKey) {
      return deterministic || this.getDefaultProfile();
    }

    try {
      const system = language === "es" ? SYSTEM_PROMPT_ES : SYSTEM_PROMPT_EN;
      const user = `${PROFILE_ANALYSIS_PROMPT}\n\nEstrategia a analizar:\n${codeOrDescription.slice(0, 12000)}`;

      let response = "";
      if (this.config.provider === "anthropic") {
        response = await this.callAnthropic(system, user);
      } else {
        response = await this.callOpenAICompatible(system, user);
      }

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as BotProfile;
      }
    } catch (e) {
      console.warn("AI profile analysis failed, using deterministic");
    }

    return deterministic || this.getDefaultProfile();
  }

  private async callAnthropic(system: string, user: string): Promise<string> {
    const client = new Anthropic({ apiKey: this.config.apiKey });
    const model = this.config.model || "claude-3-5-sonnet-20241022";

    const msg = await client.messages.create({
      model,
      max_tokens: this.config.maxTokens || 8192,
      temperature: this.config.temperature,
      system,
      messages: [{ role: "user", content: user }],
    });

    const content = msg.content[0];
    return content.type === "text" ? content.text : "";
  }

  private async callOpenAICompatible(system: string, user: string): Promise<string> {
    const providerConfig: Record<string, { baseURL?: string; defaultModel: string }> = {
      grok:       { baseURL: "https://api.x.ai/v1",                    defaultModel: "grok-2-latest" },
      groq:       { baseURL: "https://api.groq.com/openai/v1",          defaultModel: "llama-3.3-70b-versatile" },
      together:   { baseURL: "https://api.together.xyz/v1",            defaultModel: "meta-llama/Llama-3.3-70B-Instruct-Turbo" },
      openrouter: { baseURL: "https://openrouter.ai/api/v1",           defaultModel: "meta-llama/llama-3.3-70b-instruct" },
      kimi:       { baseURL: "https://api.moonshot.cn/v1",             defaultModel: "moonshot-v1-128k" },
      gemini:     { baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/", defaultModel: "gemini-2.0-flash" },
      openai:     { baseURL: undefined,                                defaultModel: "gpt-4o" },
    };

    const conf = providerConfig[this.config.provider] || providerConfig.openai;
    const baseURL = this.config.baseURL || conf.baseURL;
    const model = this.config.model || conf.defaultModel;

    const client = new OpenAI({
      apiKey: this.config.apiKey,
      baseURL,
    });

    const completion = await client.chat.completions.create({
      model,
      temperature: this.config.temperature,
      max_tokens: this.config.maxTokens,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });

    return completion.choices[0]?.message?.content || "";
  }

  private extractMQLCode(raw: string): string {
    const mqlBlock = raw.match(/```(?:mql|mq[45]|cpp)?\s*([\s\S]*?)```/i);
    if (mqlBlock) return mqlBlock[1].trim();

    const start = raw.search(/#property|void\s+OnInit|int\s+OnInit/i);
    if (start >= 0) return raw.slice(start).trim();

    return raw.trim();
  }

  private extractStrategyName(code: string): string | null {
    const match = code.match(/#property\s+copyright\s+"([^"]+)"/i) ||
                  code.match(/\/\/\s*Strategy:\s*(.+)/i) ||
                  code.match(/input\s+string\s+InpStrategyName\s*=\s*"([^"]+)"/i);
    return match ? match[1].trim().replace(/\s+/g, "_") : null;
  }

  private extractInputs(code: string): GeneratedEA["inputs"] {
    const inputs: GeneratedEA["inputs"] = [];
    const regex = /input\s+(\w+)\s+(\w+)\s*=\s*([^;]+);(?:\s*\/\/\s*(.+))?/gi;
    let m;
    while ((m = regex.exec(code)) !== null) {
      inputs.push({
        name: m[2],
        type: m[1],
        default: m[3].trim().replace(/"/g, ""),
        description: (m[4] || "").trim(),
      });
    }
    return inputs;
  }

  private detectFeatures(code: string): string[] {
    const features: string[] = [];
    if (/ATR|iATR/i.test(code)) features.push("ATR Dynamic Stops");
    if (/trailing|TrailingStop/i.test(code)) features.push("Trailing Stop");
    if (/BreakEven|break.?even/i.test(code)) features.push("Break-Even");
    if (/Hour\(|TimeHour|Session/i.test(code)) features.push("Session Filter");
    if (/Spread|MarketInfo.*MODE_SPREAD/i.test(code)) features.push("Spread Filter");
    if (/AccountBalance|AccountEquity|Risk/i.test(code)) features.push("Equity Risk %");
    if (/OrderSend|trade\.Buy|CTrade/i.test(code)) features.push("Order Management");
    if (/News|Calendar/i.test(code)) features.push("News Filter");
    if (/Magic|magic/i.test(code)) features.push("Magic Number");
    return features;
  }

  private validateCode(code: string, req: GenerationRequest): string[] {
    const warnings: string[] = [];
    if (!/OnTick|OnCalculate/i.test(code)) {
      warnings.push("No se detectó función OnTick / OnCalculate");
    }
    if (req.propFirmMode && /Martingale|Grid|Average/i.test(code)) {
      warnings.push("⚠️ Detectado posible martingale/grid — peligroso para Prop Firm");
    }
    if (!/Risk|Lot|Volume/i.test(code)) {
      warnings.push("Gestión de lotaje no detectada claramente");
    }
    return warnings;
  }

  private summarizeGraph(graph: StrategyGraph): string {
    return JSON.stringify(
      {
        name: graph.name,
        timeframe: graph.timeframe,
        style: graph.style,
        indicators: graph.indicators.map((i) => ({
          type: i.type,
          params: i.params,
        })),
        signals: graph.signals.map((s) => ({
          type: s.type,
          logic: s.logic,
          conditions: s.conditions,
        })),
        risk: graph.risk,
      },
      null,
      2
    );
  }

  private getDefaultProfile(): BotProfile {
    return {
      robustness: 65,
      complexity: 45,
      trendAffinity: 70,
      riskScore: 40,
      hurstExponent: 0.58,
      hurstLabel: "Trending",
      confidence: 60,
      regimeScores: {
        TrendFollowing: 55,
        MeanReversion: 30,
        Breakout: 40,
        Momentum: 50,
        Volatility: 25,
      },
      frequencyScores: { scalping: 20, intraday: 70, swing: 40 },
      marketCompatibility: {
        Forex: 90,
        Indices: 80,
        Metals: 85,
        Stocks: 60,
        Commodities: 70,
        Crypto: 50,
      },
      propFirmReady: true,
      propFirmChecks: {
        maxDailyLoss: { value: 3, status: "Safe" },
        maxTotalLoss: { value: 6, status: "Safe" },
        profitTarget: { value: 8, status: "Realistic" },
        minTradingDays: { value: 5, status: "Ok" },
      },
      compatibleFirms: ["FTMO", "The5ers", "True Forex Funds"],
      summary: "Estrategia de perfil moderado-tendencial, adecuada para Prop Firms con riesgo controlado.",
      recommendations: [
        "Añadir filtro de spread máximo",
        "Probar en H1 y H4",
        "Validar con walk-forward de al menos 2 años",
      ],
    };
  }
}

export default StrategyGenerator;
