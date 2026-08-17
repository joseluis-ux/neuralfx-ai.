/**
 * High-quality demo templates used when no AI API key is present.
 * These are real, compilable MQL5 EAs that demonstrate the quality level.
 */

import { GenerationRequest, GeneratedEA } from "../../types";

export function generateDemoEA(req: GenerationRequest): GeneratedEA {
  const version = req.mqlVersion || "MQL5";
  const name = "NeuralFX_Advanced_" + (req.style || "Intraday").replace(/\s/g, "");
  const isProp = !!req.propFirmMode;

  const code = version === "MQL5" ? buildMQL5Template(name, req) : buildMQL4Template(name, req);

  return {
    mqlVersion: version,
    code,
    filename: `${name}.${version === "MQL5" ? "mq5" : "mq4"}`,
    strategyName: name,
    inputs: [
      { name: "InpRiskPercent", type: "double", default: isProp ? "0.5" : "1.0", description: "Riesgo % por operación" },
      { name: "InpATRPeriod", type: "int", default: "14", description: "Periodo ATR" },
      { name: "InpSL_ATR", type: "double", default: "1.5", description: "Stop Loss en múltiplos de ATR" },
      { name: "InpTP_ATR", type: "double", default: "2.5", description: "Take Profit en múltiplos de ATR" },
      { name: "InpMagic", type: "int", default: "20260816", description: "Magic Number" },
    ],
    features: [
      "ATR Dynamic Stops",
      "Equity Risk %",
      "Trailing Stop",
      "Break-Even",
      "Session Filter",
      "Spread Filter",
      "Magic Number",
      ...(isProp ? ["Prop Firm Safe Risk"] : []),
    ],
    warnings: [
      "Modo DEMO: Este código es una plantilla profesional de alta calidad. Conecta tu API key de Anthropic/OpenAI/Grok/Gemini/Kimi para generación personalizada con IA real.",
    ],
  };
}

function buildMQL5Template(name: string, req: GenerationRequest): string {
  const risk = req.propFirmMode ? "0.5" : "1.0";
  const maxDaily = req.propFirmMode ? "3.0" : "5.0";

  return `//+------------------------------------------------------------------+
//|                                          ${name}.mq5 |
//|                        NeuralFX Advanced Generator v2.0          |
//|                     https://neuralfx-ai.vercel.app               |
//+------------------------------------------------------------------+
#property copyright "NeuralFX Advanced"
#property link      "https://neuralfx-ai.vercel.app"
#property version   "2.00"
#property strict

#include <Trade\\Trade.mqh>
#include <Trade\\PositionInfo.mqh>
#include <Trade\\AccountInfo.mqh>

//--- Inputs
input group "=== Risk Management ==="
input double InpRiskPercent     = ${risk};    // Risk % per trade
input double InpMaxDailyLoss    = ${maxDaily}; // Max Daily Loss %
input double InpMaxTotalDD      = 6.0;     // Max Total Drawdown %
input int    InpMaxTradesDay    = 4;       // Max trades per day

input group "=== Strategy ==="
input int    InpFastEMA         = 12;      // Fast EMA
input int    InpSlowEMA         = 26;      // Slow EMA
input int    InpRSIPeriod       = 14;      // RSI Period
input int    InpRSI_OB          = 70;      // RSI Overbought
input int    InpRSI_OS          = 30;      // RSI Oversold
input int    InpATRPeriod       = 14;      // ATR Period
input double InpSL_ATR          = 1.5;     // SL = ATR * this
input double InpTP_ATR          = 2.5;     // TP = ATR * this

input group "=== Trailing & BE ==="
input bool   InpUseTrailing     = true;    // Use Trailing Stop
input double InpTrailStartATR   = 1.0;     // Trail start (ATR)
input double InpTrailStepATR    = 0.5;     // Trail step (ATR)
input bool   InpUseBreakEven    = true;    // Use Break-Even
input double InpBE_ATR          = 1.0;     // BE trigger (ATR)

input group "=== Filters ==="
input int    InpMaxSpread       = 25;      // Max spread (points)
input bool   InpLondonSession   = true;    // Trade London
input bool   InpNYSession       = true;    // Trade New York
input bool   InpTokyoSession    = false;   // Trade Tokyo
input int    InpMagic           = 20260816;// Magic Number

//--- Globals
CTrade         trade;
CPositionInfo  pos;
CAccountInfo   account;
int            handleFastEMA, handleSlowEMA, handleRSI, handleATR;
double         dailyStartEquity;
datetime       lastDay;
int            tradesToday;

//+------------------------------------------------------------------+
int OnInit()
{
   trade.SetExpertMagicNumber(InpMagic);
   trade.SetDeviationInPoints(20);
   trade.SetTypeFilling(ORDER_FILLING_IOC);

   handleFastEMA = iMA(_Symbol, PERIOD_CURRENT, InpFastEMA, 0, MODE_EMA, PRICE_CLOSE);
   handleSlowEMA = iMA(_Symbol, PERIOD_CURRENT, InpSlowEMA, 0, MODE_EMA, PRICE_CLOSE);
   handleRSI     = iRSI(_Symbol, PERIOD_CURRENT, InpRSIPeriod, PRICE_CLOSE);
   handleATR     = iATR(_Symbol, PERIOD_CURRENT, InpATRPeriod);

   if(handleFastEMA == INVALID_HANDLE || handleSlowEMA == INVALID_HANDLE ||
      handleRSI == INVALID_HANDLE || handleATR == INVALID_HANDLE)
   {
      Print("Error creating indicators");
      return INIT_FAILED;
   }

   dailyStartEquity = account.Equity();
   lastDay = TimeCurrent();
   tradesToday = 0;

   Print("${name} initialized | Risk: ", InpRiskPercent, "% | Prop Mode: ", ${req.propFirmMode ? "true" : "false"});
   return INIT_SUCCEEDED;
}

//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   IndicatorRelease(handleFastEMA);
   IndicatorRelease(handleSlowEMA);
   IndicatorRelease(handleRSI);
   IndicatorRelease(handleATR);
}

//+------------------------------------------------------------------+
void OnTick()
{
   MqlDateTime dt;
   TimeToStruct(TimeCurrent(), dt);
   MqlDateTime last;
   TimeToStruct(lastDay, last);
   if(dt.day != last.day)
   {
      dailyStartEquity = account.Equity();
      tradesToday = 0;
      lastDay = TimeCurrent();
   }

   double dailyLossPct = (dailyStartEquity - account.Equity()) / dailyStartEquity * 100.0;
   if(dailyLossPct >= InpMaxDailyLoss)
   {
      CloseAllPositions();
      return;
   }

   double totalDD = (account.Balance() - account.Equity()) / account.Balance() * 100.0;
   if(totalDD >= InpMaxTotalDD) return;

   if(!IsTradingSession()) return;
   if(SymbolInfoInteger(_Symbol, SYMBOL_SPREAD) > InpMaxSpread) return;
   if(tradesToday >= InpMaxTradesDay) return;

   ManageOpenPositions();

   if(PositionsTotal() > 0) return;

   double fast[], slow[], rsi[], atr[];
   ArraySetAsSeries(fast, true);
   ArraySetAsSeries(slow, true);
   ArraySetAsSeries(rsi, true);
   ArraySetAsSeries(atr, true);

   if(CopyBuffer(handleFastEMA, 0, 0, 3, fast) < 3) return;
   if(CopyBuffer(handleSlowEMA, 0, 0, 3, slow) < 3) return;
   if(CopyBuffer(handleRSI, 0, 0, 3, rsi) < 3) return;
   if(CopyBuffer(handleATR, 0, 0, 3, atr) < 3) return;

   double atrVal = atr[0];
   if(atrVal <= 0) return;

   bool longSignal  = fast[1] > slow[1] && fast[2] <= slow[2] && rsi[0] < InpRSI_OB && rsi[0] > 40;
   bool shortSignal = fast[1] < slow[1] && fast[2] >= slow[2] && rsi[0] > InpRSI_OS && rsi[0] < 60;

   double lot = CalculateLot(atrVal * InpSL_ATR);
   if(lot <= 0) return;

   double slDist = atrVal * InpSL_ATR;
   double tpDist = atrVal * InpTP_ATR;

   if(longSignal)
   {
      double price = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
      double sl = price - slDist;
      double tp = price + tpDist;
      if(trade.Buy(lot, _Symbol, price, sl, tp, "${name}"))
         tradesToday++;
   }
   else if(shortSignal)
   {
      double price = SymbolInfoDouble(_Symbol, SYMBOL_BID);
      double sl = price + slDist;
      double tp = price - tpDist;
      if(trade.Sell(lot, _Symbol, price, sl, tp, "${name}"))
         tradesToday++;
   }
}

//+------------------------------------------------------------------+
double CalculateLot(double slDistance)
{
   double riskMoney = account.Equity() * InpRiskPercent / 100.0;
   double tickValue = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_VALUE);
   double tickSize  = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_SIZE);
   if(tickSize == 0 || tickValue == 0) return 0;

   double lossPerLot = (slDistance / tickSize) * tickValue;
   if(lossPerLot <= 0) return 0;

   double lot = riskMoney / lossPerLot;
   double minLot = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
   double maxLot = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MAX);
   double step   = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_STEP);

   lot = MathFloor(lot / step) * step;
   return MathMax(minLot, MathMin(maxLot, lot));
}

//+------------------------------------------------------------------+
void ManageOpenPositions()
{
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      if(!pos.SelectByIndex(i)) continue;
      if(pos.Symbol() != _Symbol || pos.Magic() != InpMagic) continue;

      double atr[];
      ArraySetAsSeries(atr, true);
      if(CopyBuffer(handleATR, 0, 0, 1, atr) < 1) continue;
      double atrVal = atr[0];

      double openPrice = pos.PriceOpen();
      double current   = pos.PriceCurrent();
      double sl        = pos.StopLoss();
      double tp        = pos.TakeProfit();

      if(InpUseBreakEven)
      {
         double beTrigger = atrVal * InpBE_ATR;
         if(pos.PositionType() == POSITION_TYPE_BUY && current >= openPrice + beTrigger && sl < openPrice)
            trade.PositionModify(pos.Ticket(), openPrice + 5 * _Point, tp);
         if(pos.PositionType() == POSITION_TYPE_SELL && current <= openPrice - beTrigger && (sl > openPrice || sl == 0))
            trade.PositionModify(pos.Ticket(), openPrice - 5 * _Point, tp);
      }

      if(InpUseTrailing)
      {
         double trailStart = atrVal * InpTrailStartATR;
         double trailStep  = atrVal * InpTrailStepATR;

         if(pos.PositionType() == POSITION_TYPE_BUY && current >= openPrice + trailStart)
         {
            double newSL = current - trailStep;
            if(newSL > sl) trade.PositionModify(pos.Ticket(), newSL, tp);
         }
         if(pos.PositionType() == POSITION_TYPE_SELL && current <= openPrice - trailStart)
         {
            double newSL = current + trailStep;
            if(newSL < sl || sl == 0) trade.PositionModify(pos.Ticket(), newSL, tp);
         }
      }
   }
}

//+------------------------------------------------------------------+
bool IsTradingSession()
{
   MqlDateTime dt;
   TimeToStruct(TimeCurrent(), dt);
   int hour = dt.hour;

   bool london = InpLondonSession && hour >= 7 && hour < 16;
   bool ny     = InpNYSession     && hour >= 12 && hour < 21;
   bool tokyo  = InpTokyoSession  && (hour >= 0 && hour < 9);

   return london || ny || tokyo;
}

//+------------------------------------------------------------------+
void CloseAllPositions()
{
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      if(pos.SelectByIndex(i) && pos.Magic() == InpMagic)
         trade.PositionClose(pos.Ticket());
   }
}
//+------------------------------------------------------------------+
`;
}

function buildMQL4Template(name: string, req: GenerationRequest): string {
  return `//+------------------------------------------------------------------+
//|                                          ${name}.mq4 |
//|                        NeuralFX Advanced Generator v2.0          |
//+------------------------------------------------------------------+
#property copyright "NeuralFX Advanced"
#property version   "2.00"
#property strict

input double InpRiskPercent = ${req.propFirmMode ? "0.5" : "1.0"};
input int    InpFastEMA = 12;
input int    InpSlowEMA = 26;
input int    InpRSIPeriod = 14;
input int    InpATRPeriod = 14;
input double InpSL_ATR = 1.5;
input double InpTP_ATR = 2.5;
input int    InpMagic = 20260816;
input int    InpMaxSpread = 25;

int OnInit() { return INIT_SUCCEEDED; }
void OnDeinit(const int reason) {}

void OnTick()
{
   if(OrdersTotal() > 0) return;
   if(MarketInfo(Symbol(), MODE_SPREAD) > InpMaxSpread) return;

   double fast1 = iMA(NULL, 0, InpFastEMA, 0, MODE_EMA, PRICE_CLOSE, 1);
   double fast2 = iMA(NULL, 0, InpFastEMA, 0, MODE_EMA, PRICE_CLOSE, 2);
   double slow1 = iMA(NULL, 0, InpSlowEMA, 0, MODE_EMA, PRICE_CLOSE, 1);
   double slow2 = iMA(NULL, 0, InpSlowEMA, 0, MODE_EMA, PRICE_CLOSE, 2);
   double rsi   = iRSI(NULL, 0, InpRSIPeriod, PRICE_CLOSE, 0);
   double atr   = iATR(NULL, 0, InpATRPeriod, 0);

   double lot = CalculateLot(atr * InpSL_ATR);
   if(lot <= 0) return;

   if(fast1 > slow1 && fast2 <= slow2 && rsi < 70)
   {
      double sl = Ask - atr * InpSL_ATR;
      double tp = Ask + atr * InpTP_ATR;
      OrderSend(Symbol(), OP_BUY, lot, Ask, 3, sl, tp, "${name}", InpMagic, 0, clrBlue);
   }
   else if(fast1 < slow1 && fast2 >= slow2 && rsi > 30)
   {
      double sl = Bid + atr * InpSL_ATR;
      double tp = Bid - atr * InpTP_ATR;
      OrderSend(Symbol(), OP_SELL, lot, Bid, 3, sl, tp, "${name}", InpMagic, 0, clrRed);
   }
}

double CalculateLot(double slDistance)
{
   double riskMoney = AccountEquity() * InpRiskPercent / 100.0;
   double tickValue = MarketInfo(Symbol(), MODE_TICKVALUE);
   double tickSize  = MarketInfo(Symbol(), MODE_TICKSIZE);
   if(tickSize == 0) return 0;
   double lossPerLot = (slDistance / tickSize) * tickValue;
   if(lossPerLot <= 0) return 0;
   double lot = riskMoney / lossPerLot;
   return NormalizeDouble(MathMax(MarketInfo(Symbol(), MODE_MINLOT), lot), 2);
}
//+------------------------------------------------------------------+
`;
}
