// ConfigHelper.ts
import fs from "node:fs"
import path from "node:path"
import { app } from "electron"
import { EventEmitter } from "events"
import { OpenAI } from "openai"

interface Config {
  apiKey: string;
  apiProvider: "openai" | "gemini" | "anthropic" | "groq";
  extractionModel: string;
  solutionModel: string;
  debuggingModel: string;
  language: string;
  opacity: number;
}

export class ConfigHelper extends EventEmitter {
  private configPath: string;
  private defaultConfig: Config = {
    apiKey: "",
    apiProvider: "groq",
    extractionModel: "llama-3.2-11b-vision-preview",
    solutionModel: "llama-3.3-70b-versatile",
    debuggingModel: "llama-3.2-11b-vision-preview",
    language: "python",
    opacity: 1.0
  };

  constructor() {
    super();
    try {
      this.configPath = path.join(app.getPath('userData'), 'config.json');
      console.log('Config path:', this.configPath);
    } catch (err) {
      console.warn('Could not access user data path, using fallback');
      this.configPath = path.join(process.cwd(), 'config.json');
    }
    this.ensureConfigExists();
  }

  private ensureConfigExists(): void {
    try {
      if (!fs.existsSync(this.configPath)) {
        // Pre-populate Groq key from environment if available
        const config = { ...this.defaultConfig };
        if (process.env.GROQ_API_KEY) {
          config.apiKey = process.env.GROQ_API_KEY;
          config.apiProvider = "groq";
        }
        this.saveConfig(config);
      }
    } catch (err) {
      console.error("Error ensuring config exists:", err);
    }
  }

  private sanitizeModelSelection(model: string, provider: "openai" | "gemini" | "anthropic" | "groq"): string {
    if (provider === "openai") {
      const allowedModels = [
        'gpt-4o', 'gpt-4o-mini',
        'gpt-4.1', 'gpt-4.1-mini', 'gpt-4.1-nano',
        'o3-mini', 'o4-mini'
      ];
      if (!allowedModels.includes(model)) {
        console.warn(`Invalid OpenAI model: ${model}. Using gpt-4o`);
        return 'gpt-4o';
      }
      return model;
    } else if (provider === "gemini") {
      const allowedModels = [
        'gemini-1.5-pro', 'gemini-2.0-flash',
        'gemini-2.0-flash-lite', 'gemini-2.5-pro', 'gemini-2.5-flash'
      ];
      if (!allowedModels.includes(model)) {
        console.warn(`Invalid Gemini model: ${model}. Using gemini-2.0-flash`);
        return 'gemini-2.0-flash';
      }
      return model;
    } else if (provider === "anthropic") {
      const allowedModels = [
        'claude-3-7-sonnet-20250219', 'claude-3-5-sonnet-20241022',
        'claude-3-opus-20240229', 'claude-3-5-haiku-20241022',
        'claude-opus-4-6', 'claude-sonnet-4-6'
      ];
      if (!allowedModels.includes(model)) {
        console.warn(`Invalid Anthropic model: ${model}. Using claude-3-7-sonnet-20250219`);
        return 'claude-3-7-sonnet-20250219';
      }
      return model;
    } else if (provider === "groq") {
      const allowedModels = [
        'llama-3.3-70b-versatile', 'llama-3.1-8b-instant',
        'llama-3.2-11b-vision-preview', 'llama-3.2-90b-vision-preview',
        'llama-3.1-70b-versatile', 'mixtral-8x7b-32768', 'gemma2-9b-it'
      ];
      if (!allowedModels.includes(model)) {
        console.warn(`Invalid Groq model: ${model}. Using llama-3.3-70b-versatile`);
        return 'llama-3.3-70b-versatile';
      }
      return model;
    }
    return model;
  }

  public loadConfig(): Config {
    try {
      if (fs.existsSync(this.configPath)) {
        const configData = fs.readFileSync(this.configPath, 'utf8');
        const config = JSON.parse(configData);

        const validProviders = ["openai", "gemini", "anthropic", "groq"];
        if (!validProviders.includes(config.apiProvider)) {
          config.apiProvider = "groq";
        }

        // If Groq is selected and no key stored, fall back to env
        if (config.apiProvider === "groq" && !config.apiKey && process.env.GROQ_API_KEY) {
          config.apiKey = process.env.GROQ_API_KEY;
        }

        if (config.extractionModel) {
          config.extractionModel = this.sanitizeModelSelection(config.extractionModel, config.apiProvider);
        }
        if (config.solutionModel) {
          config.solutionModel = this.sanitizeModelSelection(config.solutionModel, config.apiProvider);
        }
        if (config.debuggingModel) {
          config.debuggingModel = this.sanitizeModelSelection(config.debuggingModel, config.apiProvider);
        }

        return { ...this.defaultConfig, ...config };
      }

      const config = { ...this.defaultConfig };
      if (process.env.GROQ_API_KEY) {
        config.apiKey = process.env.GROQ_API_KEY;
      }
      this.saveConfig(config);
      return config;
    } catch (err) {
      console.error("Error loading config:", err);
      return this.defaultConfig;
    }
  }

  public saveConfig(config: Config): void {
    try {
      const configDir = path.dirname(this.configPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
    } catch (err) {
      console.error("Error saving config:", err);
    }
  }

  public updateConfig(updates: Partial<Config>): Config {
    try {
      const currentConfig = this.loadConfig();
      let provider = updates.apiProvider || currentConfig.apiProvider;

      // Auto-detect provider from API key format
      if (updates.apiKey && !updates.apiProvider) {
        const key = updates.apiKey.trim();
        if (key.startsWith('gsk_')) {
          provider = "groq";
          console.log("Auto-detected Groq API key format");
        } else if (key.startsWith('sk-ant-')) {
          provider = "anthropic";
          console.log("Auto-detected Anthropic API key format");
        } else if (key.startsWith('sk-')) {
          provider = "openai";
          console.log("Auto-detected OpenAI API key format");
        } else {
          provider = "gemini";
          console.log("Using Gemini API key format (default)");
        }
        updates.apiProvider = provider;
      }

      // Reset models when provider changes
      if (updates.apiProvider && updates.apiProvider !== currentConfig.apiProvider) {
        if (updates.apiProvider === "openai") {
          updates.extractionModel = "gpt-4.1";
          updates.solutionModel = "gpt-4.1";
          updates.debuggingModel = "gpt-4.1";
        } else if (updates.apiProvider === "anthropic") {
          updates.extractionModel = "claude-sonnet-4-6";
          updates.solutionModel = "claude-sonnet-4-6";
          updates.debuggingModel = "claude-sonnet-4-6";
        } else if (updates.apiProvider === "groq") {
          updates.extractionModel = "llama-3.2-11b-vision-preview";
          updates.solutionModel = "llama-3.3-70b-versatile";
          updates.debuggingModel = "llama-3.2-11b-vision-preview";
        } else {
          updates.extractionModel = "gemini-2.5-pro";
          updates.solutionModel = "gemini-2.5-pro";
          updates.debuggingModel = "gemini-2.5-pro";
        }
      }

      if (updates.extractionModel) {
        updates.extractionModel = this.sanitizeModelSelection(updates.extractionModel, provider);
      }
      if (updates.solutionModel) {
        updates.solutionModel = this.sanitizeModelSelection(updates.solutionModel, provider);
      }
      if (updates.debuggingModel) {
        updates.debuggingModel = this.sanitizeModelSelection(updates.debuggingModel, provider);
      }

      const newConfig = { ...currentConfig, ...updates };
      this.saveConfig(newConfig);

      if (updates.apiKey !== undefined || updates.apiProvider !== undefined ||
          updates.extractionModel !== undefined || updates.solutionModel !== undefined ||
          updates.debuggingModel !== undefined || updates.language !== undefined) {
        this.emit('config-updated', newConfig);
      }

      return newConfig;
    } catch (error) {
      console.error('Error updating config:', error);
      return this.defaultConfig;
    }
  }

  public hasApiKey(): boolean {
    const config = this.loadConfig();
    // Also check env for Groq
    if (config.apiProvider === "groq" && !config.apiKey && process.env.GROQ_API_KEY) {
      return true;
    }
    return !!config.apiKey && config.apiKey.trim().length > 0;
  }

  public isValidApiKeyFormat(apiKey: string, provider?: "openai" | "gemini" | "anthropic" | "groq"): boolean {
    if (!provider) {
      const key = apiKey.trim();
      if (key.startsWith('gsk_')) {
        provider = "groq";
      } else if (key.startsWith('sk-ant-')) {
        provider = "anthropic";
      } else if (key.startsWith('sk-')) {
        provider = "openai";
      } else {
        provider = "gemini";
      }
    }

    if (provider === "openai") {
      return /^sk-[a-zA-Z0-9]{32,}$/.test(apiKey.trim());
    } else if (provider === "gemini") {
      return apiKey.trim().length >= 10;
    } else if (provider === "anthropic") {
      return /^sk-ant-[a-zA-Z0-9]{32,}$/.test(apiKey.trim());
    } else if (provider === "groq") {
      return /^gsk_[a-zA-Z0-9]{32,}$/.test(apiKey.trim());
    }

    return false;
  }

  public getOpacity(): number {
    const config = this.loadConfig();
    return config.opacity !== undefined ? config.opacity : 1.0;
  }

  public setOpacity(opacity: number): void {
    const validOpacity = Math.min(1.0, Math.max(0.1, opacity));
    this.updateConfig({ opacity: validOpacity });
  }

  public getLanguage(): string {
    const config = this.loadConfig();
    return config.language || "python";
  }

  public setLanguage(language: string): void {
    this.updateConfig({ language });
  }

  public async testApiKey(apiKey: string, provider?: "openai" | "gemini" | "anthropic" | "groq"): Promise<{valid: boolean, error?: string}> {
    if (!provider) {
      const key = apiKey.trim();
      if (key.startsWith('gsk_')) {
        provider = "groq";
      } else if (key.startsWith('sk-ant-')) {
        provider = "anthropic";
      } else if (key.startsWith('sk-')) {
        provider = "openai";
      } else {
        provider = "gemini";
      }
    }

    if (provider === "openai") return this.testOpenAIKey(apiKey);
    if (provider === "gemini") return this.testGeminiKey(apiKey);
    if (provider === "anthropic") return this.testAnthropicKey(apiKey);
    if (provider === "groq") return this.testGroqKey(apiKey);

    return { valid: false, error: "Unknown API provider" };
  }

  private async testOpenAIKey(apiKey: string): Promise<{valid: boolean, error?: string}> {
    try {
      const openai = new OpenAI({ apiKey });
      await openai.models.list();
      return { valid: true };
    } catch (error: any) {
      let errorMessage = 'Unknown error validating OpenAI API key';
      if (error.status === 401) errorMessage = 'Invalid API key. Please check your OpenAI key and try again.';
      else if (error.status === 429) errorMessage = 'Rate limit exceeded. Your OpenAI API key has reached its limit.';
      else if (error.status === 500) errorMessage = 'OpenAI server error. Please try again later.';
      else if (error.message) errorMessage = `Error: ${error.message}`;
      return { valid: false, error: errorMessage };
    }
  }

  private async testGeminiKey(apiKey: string): Promise<{valid: boolean, error?: string}> {
    try {
      if (apiKey && apiKey.trim().length >= 20) return { valid: true };
      return { valid: false, error: 'Invalid Gemini API key format.' };
    } catch (error: any) {
      return { valid: false, error: `Error: ${error.message}` };
    }
  }

  private async testAnthropicKey(apiKey: string): Promise<{valid: boolean, error?: string}> {
    try {
      if (apiKey && /^sk-ant-[a-zA-Z0-9]{32,}$/.test(apiKey.trim())) return { valid: true };
      return { valid: false, error: 'Invalid Anthropic API key format.' };
    } catch (error: any) {
      return { valid: false, error: `Error: ${error.message}` };
    }
  }

  private async testGroqKey(apiKey: string): Promise<{valid: boolean, error?: string}> {
    try {
      if (!apiKey || !/^gsk_[a-zA-Z0-9]{32,}$/.test(apiKey.trim())) {
        return { valid: false, error: 'Invalid Groq API key format. Groq keys start with "gsk_".' };
      }
      const groq = new OpenAI({
        apiKey,
        baseURL: "https://api.groq.com/openai/v1"
      });
      await groq.models.list();
      return { valid: true };
    } catch (error: any) {
      let errorMessage = 'Unknown error validating Groq API key';
      if (error.status === 401) errorMessage = 'Invalid Groq API key. Please check your key and try again.';
      else if (error.status === 429) errorMessage = 'Groq rate limit exceeded.';
      else if (error.message) errorMessage = `Error: ${error.message}`;
      return { valid: false, error: errorMessage };
    }
  }
}

// Export a singleton instance
export const configHelper = new ConfigHelper();
