"use client";

import { useState, useEffect } from "react";

const PROVIDERS = [
  { id: "demo", name: "Demo (sin clave)", free: true, placeholder: "" },
  { id: "groq", name: "Groq (gratis y rápido)", free: true, placeholder: "gsk_..." },
  { id: "gemini", name: "Google Gemini (gratis)", free: true, placeholder: "AIzaSy..." },
  { id: "kimi", name: "Kimi / Moonshot (gratis)", free: true, placeholder: "sk-..." },
  { id: "openrouter", name: "OpenRouter", free: true, placeholder: "sk-or-v1-..." },
  { id: "together", name: "Together.ai", free: true, placeholder: "..." },
  { id: "anthropic", name: "Claude (Anthropic)", free: false, placeholder: "sk-ant-..." },
  { id: "openai", name: "OpenAI", free: false, placeholder: "sk-..." },
  { id: "grok", name: "Grok (xAI)", free: false, placeholder: "xai-..." },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ApiKeyModal({ open, onClose }: Props) {
  const [provider, setProvider] = useState("demo");
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    if (open) {
      setProvider(localStorage.getItem("neuralfx_provider") || "demo");
      setApiKey(localStorage.getItem("neuralfx_api_key") || "");
    }
  }, [open]);

  if (!open) return null;

  const save = () => {
    localStorage.setItem("neuralfx_provider", provider);
    if (provider === "demo" || !apiKey.trim()) {
      localStorage.removeItem("neuralfx_api_key");
    } else {
      localStorage.setItem("neuralfx_api_key", apiKey.trim());
    }
    onClose();
  };

  const current = PROVIDERS.find((p) => p.id === provider);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <h2 className="mb-1 text-xl font-bold text-white">Configuración de IA</h2>
        <p className="mb-5 text-sm text-slate-400">
          Las claves se guardan solo en tu navegador (localStorage).
        </p>

        <label className="mb-1 block text-sm text-slate-300">Proveedor</label>
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          className="mb-4 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white"
        >
          {PROVIDERS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} {p.free ? "· Gratis" : ""}
            </option>
          ))}
        </select>

        {provider !== "demo" && (
          <>
            <label className="mb-1 block text-sm text-slate-300">API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={current?.placeholder || "Tu API key"}
              className="mb-2 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white"
            />
            <p className="mb-4 text-xs text-slate-500">
              {provider === "groq" && "Obtén clave en console.groq.com"}
              {provider === "gemini" && "Obtén clave en aistudio.google.com/apikey"}
              {provider === "kimi" && "Obtén clave en platform.moonshot.cn"}
              {provider === "openrouter" && "Obtén clave en openrouter.ai"}
            </p>
          </>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-slate-300 hover:bg-slate-800"
          >
            Cancelar
          </button>
          <button
            onClick={save}
            className="rounded-lg bg-cyan-500 px-4 py-2 font-medium text-black hover:bg-cyan-400"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
