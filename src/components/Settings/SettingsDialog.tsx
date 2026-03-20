import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useToast } from "../../contexts/toast";

type APIProvider = "openai" | "gemini" | "anthropic" | "groq";

type AIModel = { id: string; name: string; description: string };

type ModelCategory = {
  key: "extractionModel" | "solutionModel" | "debuggingModel";
  title: string;
  description: string;
  openaiModels: AIModel[];
  geminiModels: AIModel[];
  anthropicModels: AIModel[];
  groqModels: AIModel[];
};

const modelCategories: ModelCategory[] = [
  {
    key: "extractionModel",
    title: "Problem Extraction",
    description: "Analyzes screenshots to extract the problem (vision required)",
    openaiModels: [
      { id: "gpt-4.1",      name: "GPT-4.1",       description: "Latest, best vision accuracy" },
      { id: "gpt-4o",       name: "GPT-4o",         description: "Strong vision + reasoning" },
      { id: "gpt-4.1-mini", name: "GPT-4.1 Mini",   description: "Fast, cost-effective" },
      { id: "gpt-4o-mini",  name: "GPT-4o Mini",    description: "Lightweight" },
      { id: "gpt-4.1-nano", name: "GPT-4.1 Nano",   description: "Fastest, minimal cost" },
    ],
    geminiModels: [
      { id: "gemini-2.5-pro",        name: "Gemini 2.5 Pro",        description: "Best overall performance" },
      { id: "gemini-2.5-flash",      name: "Gemini 2.5 Flash",      description: "Fast and capable" },
      { id: "gemini-2.0-flash",      name: "Gemini 2.0 Flash",      description: "Reliable and cost-effective" },
      { id: "gemini-2.0-flash-lite", name: "Gemini 2.0 Flash Lite", description: "Lightest option" },
      { id: "gemini-1.5-pro",        name: "Gemini 1.5 Pro",        description: "Proven performance" },
    ],
    anthropicModels: [
      { id: "claude-opus-4-6",            name: "Claude Opus 4.6",   description: "Most capable, best vision" },
      { id: "claude-sonnet-4-6",          name: "Claude Sonnet 4.6", description: "Balanced speed and quality" },
      { id: "claude-3-7-sonnet-20250219", name: "Claude 3.7 Sonnet", description: "Extended thinking" },
      { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet", description: "Strong vision" },
      { id: "claude-3-5-haiku-20241022",  name: "Claude 3.5 Haiku",  description: "Fastest Claude" },
      { id: "claude-3-opus-20240229",     name: "Claude 3 Opus",     description: "High intelligence" },
    ],
    groqModels: [
      { id: "llama-3.2-90b-vision-preview", name: "Llama 3.2 90B Vision", description: "Best Groq vision model" },
      { id: "llama-3.2-11b-vision-preview", name: "Llama 3.2 11B Vision", description: "Fast Groq vision model" },
    ],
  },
  {
    key: "solutionModel",
    title: "Solution Generation",
    description: "Generates the coding solution (text only)",
    openaiModels: [
      { id: "gpt-4.1",      name: "GPT-4.1",      description: "Best reasoning and code quality" },
      { id: "gpt-4o",       name: "GPT-4o",        description: "Strong coding performance" },
      { id: "gpt-4.1-mini", name: "GPT-4.1 Mini",  description: "Fast, cost-effective" },
      { id: "gpt-4.1-nano", name: "GPT-4.1 Nano",  description: "Fastest — nano chat" },
      { id: "gpt-4o-mini",  name: "GPT-4o Mini",   description: "Lightweight" },
      { id: "o4-mini",      name: "o4-mini",        description: "Reasoning model, great for hard problems" },
      { id: "o3-mini",      name: "o3-mini",        description: "Deep reasoning, slower" },
    ],
    geminiModels: [
      { id: "gemini-2.5-pro",        name: "Gemini 2.5 Pro",        description: "Best reasoning and coding" },
      { id: "gemini-2.5-flash",      name: "Gemini 2.5 Flash",      description: "Fast with strong reasoning" },
      { id: "gemini-2.0-flash",      name: "Gemini 2.0 Flash",      description: "Reliable and fast" },
      { id: "gemini-2.0-flash-lite", name: "Gemini 2.0 Flash Lite", description: "Lightest option" },
      { id: "gemini-1.5-pro",        name: "Gemini 1.5 Pro",        description: "Proven performance" },
    ],
    anthropicModels: [
      { id: "claude-opus-4-6",            name: "Claude Opus 4.6",   description: "Most capable for coding" },
      { id: "claude-sonnet-4-6",          name: "Claude Sonnet 4.6", description: "Best speed/quality balance" },
      { id: "claude-3-7-sonnet-20250219", name: "Claude 3.7 Sonnet", description: "Extended thinking" },
      { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet", description: "Strong coding" },
      { id: "claude-3-5-haiku-20241022",  name: "Claude 3.5 Haiku",  description: "Fastest Claude" },
      { id: "claude-3-opus-20240229",     name: "Claude 3 Opus",     description: "High intelligence" },
    ],
    groqModels: [
      { id: "llama-3.3-70b-versatile",      name: "Llama 3.3 70B",       description: "Best Groq text model" },
      { id: "llama-3.1-70b-versatile",      name: "Llama 3.1 70B",       description: "Strong performance" },
      { id: "mixtral-8x7b-32768",           name: "Mixtral 8x7B",        description: "Good balance" },
      { id: "llama-3.1-8b-instant",         name: "Llama 3.1 8B (Nano)", description: "Fastest — nano chat" },
      { id: "gemma2-9b-it",                 name: "Gemma 2 9B",          description: "Google model via Groq" },
    ],
  },
  {
    key: "debuggingModel",
    title: "Debugging",
    description: "Debugs and improves solutions from screenshots (vision required)",
    openaiModels: [
      { id: "gpt-4.1",      name: "GPT-4.1",      description: "Best at reading code screenshots" },
      { id: "gpt-4o",       name: "GPT-4o",        description: "Strong vision + reasoning" },
      { id: "gpt-4.1-mini", name: "GPT-4.1 Mini",  description: "Fast, cost-effective" },
      { id: "gpt-4o-mini",  name: "GPT-4o Mini",   description: "Lightweight" },
      { id: "gpt-4.1-nano", name: "GPT-4.1 Nano",  description: "Fastest option" },
    ],
    geminiModels: [
      { id: "gemini-2.5-pro",        name: "Gemini 2.5 Pro",        description: "Best for debugging" },
      { id: "gemini-2.5-flash",      name: "Gemini 2.5 Flash",      description: "Fast analysis" },
      { id: "gemini-2.0-flash",      name: "Gemini 2.0 Flash",      description: "Reliable option" },
      { id: "gemini-2.0-flash-lite", name: "Gemini 2.0 Flash Lite", description: "Lightest option" },
      { id: "gemini-1.5-pro",        name: "Gemini 1.5 Pro",        description: "Proven performance" },
    ],
    anthropicModels: [
      { id: "claude-opus-4-6",            name: "Claude Opus 4.6",   description: "Best at code debugging" },
      { id: "claude-sonnet-4-6",          name: "Claude Sonnet 4.6", description: "Fast debugging" },
      { id: "claude-3-7-sonnet-20250219", name: "Claude 3.7 Sonnet", description: "Extended thinking" },
      { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet", description: "Strong vision" },
      { id: "claude-3-5-haiku-20241022",  name: "Claude 3.5 Haiku",  description: "Fastest Claude" },
      { id: "claude-3-opus-20240229",     name: "Claude 3 Opus",     description: "High intelligence" },
    ],
    groqModels: [
      { id: "llama-3.2-90b-vision-preview", name: "Llama 3.2 90B Vision", description: "Best Groq vision model" },
      { id: "llama-3.2-11b-vision-preview", name: "Llama 3.2 11B Vision", description: "Fast Groq vision model" },
    ],
  },
];

const PROVIDER_DEFAULTS: Record<APIProvider, { extraction: string; solution: string; debugging: string }> = {
  groq:      { extraction: "llama-3.2-11b-vision-preview", solution: "llama-3.3-70b-versatile",  debugging: "llama-3.2-11b-vision-preview" },
  openai:    { extraction: "gpt-4.1",                      solution: "gpt-4.1",                   debugging: "gpt-4.1" },
  gemini:    { extraction: "gemini-2.5-pro",               solution: "gemini-2.5-pro",             debugging: "gemini-2.5-pro" },
  anthropic: { extraction: "claude-sonnet-4-6",            solution: "claude-sonnet-4-6",          debugging: "claude-sonnet-4-6" },
};

const PROVIDERS: { id: APIProvider; label: string; subtitle: string }[] = [
  { id: "groq",      label: "Groq",    subtitle: "Llama / Mixtral" },
  { id: "openai",    label: "OpenAI",  subtitle: "GPT-4.1 / o4" },
  { id: "gemini",    label: "Gemini",  subtitle: "2.5 Pro / Flash" },
  { id: "anthropic", label: "Claude",  subtitle: "Opus / Sonnet" },
];

const KEY_PLACEHOLDERS: Record<APIProvider, string> = {
  groq: "gsk_...", openai: "sk-...", gemini: "Enter your Gemini API key", anthropic: "sk-ant-...",
};

const KEY_INSTRUCTIONS: Record<APIProvider, { site: string; keysUrl: string; siteName: string }> = {
  groq:      { site: "https://console.groq.com",             keysUrl: "https://console.groq.com/keys",               siteName: "Groq Console" },
  openai:    { site: "https://platform.openai.com/signup",   keysUrl: "https://platform.openai.com/api-keys",        siteName: "OpenAI" },
  gemini:    { site: "https://aistudio.google.com/",         keysUrl: "https://aistudio.google.com/app/apikey",      siteName: "Google AI Studio" },
  anthropic: { site: "https://console.anthropic.com/signup", keysUrl: "https://console.anthropic.com/settings/keys", siteName: "Anthropic" },
};

interface SettingsDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SettingsDialog({ open: externalOpen, onOpenChange }: SettingsDialogProps) {
  const [open, setOpen] = useState(externalOpen || false);
  const [apiKey, setApiKey] = useState("");
  const [apiProvider, setApiProvider] = useState<APIProvider>("groq");
  const [extractionModel, setExtractionModel] = useState(PROVIDER_DEFAULTS.groq.extraction);
  const [solutionModel, setSolutionModel] = useState(PROVIDER_DEFAULTS.groq.solution);
  const [debuggingModel, setDebuggingModel] = useState(PROVIDER_DEFAULTS.groq.debugging);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (externalOpen !== undefined) setOpen(externalOpen);
  }, [externalOpen]);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (onOpenChange && newOpen !== externalOpen) onOpenChange(newOpen);
  };

  useEffect(() => {
    if (!open) return;
    setIsLoading(true);
    window.electronAPI.getConfig()
      .then((config: any) => {
        setApiKey(config.apiKey || "");
        const p: APIProvider = config.apiProvider || "groq";
        setApiProvider(p);
        setExtractionModel(config.extractionModel || PROVIDER_DEFAULTS[p].extraction);
        setSolutionModel(config.solutionModel     || PROVIDER_DEFAULTS[p].solution);
        setDebuggingModel(config.debuggingModel   || PROVIDER_DEFAULTS[p].debugging);
      })
      .catch(() => showToast("Error", "Failed to load settings", "error"))
      .finally(() => setIsLoading(false));
  }, [open, showToast]);

  const handleProviderChange = (p: APIProvider) => {
    setApiProvider(p);
    setExtractionModel(PROVIDER_DEFAULTS[p].extraction);
    setSolutionModel(PROVIDER_DEFAULTS[p].solution);
    setDebuggingModel(PROVIDER_DEFAULTS[p].debugging);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const result = await window.electronAPI.updateConfig({
        apiKey, apiProvider, extractionModel, solutionModel, debuggingModel,
      });
      if (result) {
        showToast("Success", "Settings saved successfully", "success");
        handleOpenChange(false);
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch {
      showToast("Error", "Failed to save settings", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const maskApiKey = (key: string) =>
    key.length < 10 ? "" : `${key.substring(0, 6)}...${key.substring(key.length - 4)}`;

  const instr = KEY_INSTRUCTIONS[apiProvider];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-md bg-black border border-white/10 text-white settings-dialog"
        style={{
          position: "fixed", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(480px, 90vw)", maxHeight: "90vh",
          overflowY: "auto", zIndex: 9999, margin: 0, padding: "20px",
        }}
      >
        <DialogHeader>
          <DialogTitle>API Settings</DialogTitle>
          <DialogDescription className="text-white/70">
            Configure your API key and model preferences.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Provider */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">API Provider</label>
            <div className="grid grid-cols-2 gap-2">
              {PROVIDERS.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleProviderChange(p.id)}
                  className={`p-2 rounded-lg cursor-pointer transition-colors ${
                    apiProvider === p.id
                      ? "bg-white/10 border border-white/20"
                      : "bg-black/30 border border-white/5 hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${apiProvider === p.id ? "bg-white" : "bg-white/20"}`} />
                    <div>
                      <p className="font-medium text-white text-sm">{p.label}</p>
                      <p className="text-xs text-white/60">{p.subtitle}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* API Key */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white" htmlFor="apiKey">
              {PROVIDERS.find((p) => p.id === apiProvider)?.label} API Key
            </label>
            <Input
              id="apiKey" type="password" value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={KEY_PLACEHOLDERS[apiProvider]}
              className="bg-black/50 border-white/10 text-white"
            />
            {apiKey && <p className="text-xs text-white/50">Current: {maskApiKey(apiKey)}</p>}
            <div className="mt-2 p-2 rounded-md bg-white/5 border border-white/10">
              <p className="text-xs text-white/80 mb-1">Don't have an API key?</p>
              <p className="text-xs text-white/60 mb-1">
                1. Sign up at{" "}
                <button onClick={() => window.electronAPI.openLink(instr.site)} className="text-blue-400 hover:underline cursor-pointer">
                  {instr.siteName}
                </button>
              </p>
              <p className="text-xs text-white/60">
                2. Get your key from the{" "}
                <button onClick={() => window.electronAPI.openLink(instr.keysUrl)} className="text-blue-400 hover:underline cursor-pointer">
                  API Keys
                </button>{" "}section and paste it above
              </p>
            </div>
          </div>

          {/* Model Selection */}
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-white">Model Selection</label>
              <p className="text-xs text-white/60 mt-0.5">Choose which model handles each stage</p>
            </div>

            {modelCategories.map((category) => {
              const models =
                apiProvider === "openai"    ? category.openaiModels :
                apiProvider === "gemini"    ? category.geminiModels :
                apiProvider === "anthropic" ? category.anthropicModels :
                category.groqModels;
              const currentValue =
                category.key === "extractionModel" ? extractionModel :
                category.key === "solutionModel"   ? solutionModel : debuggingModel;
              const setValue =
                category.key === "extractionModel" ? setExtractionModel :
                category.key === "solutionModel"   ? setSolutionModel : setDebuggingModel;

              return (
                <div key={category.key}>
                  <label className="text-sm font-medium text-white mb-1 block">{category.title}</label>
                  <p className="text-xs text-white/60 mb-2">{category.description}</p>
                  <div className="space-y-1">
                    {models.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => setValue(m.id)}
                        className={`p-2 rounded-lg cursor-pointer transition-colors ${
                          currentValue === m.id
                            ? "bg-white/10 border border-white/20"
                            : "bg-black/30 border border-white/5 hover:bg-white/5"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${currentValue === m.id ? "bg-white" : "bg-white/20"}`} />
                          <div>
                            <p className="font-medium text-white text-xs">{m.name}</p>
                            <p className="text-xs text-white/50">{m.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Shortcuts */}
          <div className="space-y-2 mt-4">
            <label className="text-sm font-medium text-white">Keyboard Shortcuts</label>
            <div className="bg-black/30 border border-white/10 rounded-lg p-3">
              <div className="grid grid-cols-2 gap-y-2 text-xs">
                {[
                  ["Toggle Visibility",      "Ctrl+B"],
                  ["Take Screenshot",        "Ctrl+H"],
                  ["Process Screenshots",    "Ctrl+Enter"],
                  ["Delete Last Screenshot", "Ctrl+L"],
                  ["Reset View",             "Ctrl+R"],
                  ["Quit Application",       "Ctrl+Q"],
                  ["Move Window",            "Ctrl+Arrows"],
                  ["Opacity -/+",            "Ctrl+[ / ]"],
                  ["Zoom -/+",               "Ctrl+- / ="],
                  ["Reset Zoom",             "Ctrl+0"],
                ].map(([action, shortcut], i) => (
                  <div key={i} className="contents">
                    <div className="text-white/70">{action}</div>
                    <div className="text-white/90 font-mono">{shortcut}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button variant="outline" onClick={() => handleOpenChange(false)} className="border-white/10 hover:bg-white/5 text-white">
            Cancel
          </Button>
          <Button
            className="px-4 py-3 bg-white text-black rounded-xl font-medium hover:bg-white/90 transition-colors"
            onClick={handleSave}
            disabled={isLoading || !apiKey}
          >
            {isLoading ? "Saving..." : "Save Settings"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
