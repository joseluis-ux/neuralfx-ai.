import { NextRequest, NextResponse } from "next/server";
import { StrategyGenerator } from "@/modules/generator";
import { optimizeForPropFirm } from "@/modules/propfirm/optimizer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      provider = "demo",
      apiKey,
      prompt,
      style,
      timeframe,
      markets,
      propFirmMode = true,
      firm = "FTMO",
      mqlVersion = "MQL5",
      language = "es",
    } = body;

    const gen = new StrategyGenerator({
      provider: apiKey ? provider : "demo",
      apiKey: apiKey || undefined,
    });

    const request = optimizeForPropFirm(
      {
        prompt,
        style,
        timeframe,
        markets,
        propFirmMode,
        firm,
        mqlVersion,
        language,
        includeTrailing: true,
      },
      firm
    );

    const ea = await gen.generate(request);
    const profile = await gen.analyzeProfile(ea.code, language);

    return NextResponse.json({ ea, profile });
  } catch (error: any) {
    console.error("Generate error:", error);
    return NextResponse.json(
      { error: error.message || "Error generando estrategia" },
      { status: 500 }
    );
  }
}
