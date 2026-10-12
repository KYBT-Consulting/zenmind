import { GoogleGenAI } from '@google/genai';

export interface GeneratedMindMapNode {
  data: {
    text: string;
    expand?: boolean;
    shape?: string;
    fillColor?: string;
  };
  children?: GeneratedMindMapNode[];
}

export type AIProvider = 'gemini' | 'openai-compatible';

export interface AIConfig {
  provider: AIProvider;
  geminiApiKey: string;
  geminiModel: string;
  openaiEndpoint: string;
  openaiApiKey: string;
  openaiModel: string;
}

export const DEFAULT_AI_CONFIG: AIConfig = {
  provider: 'gemini',
  geminiApiKey: '',
  geminiModel: 'gemini-2.5-flash',
  openaiEndpoint: 'https://api.openai.com/v1',
  openaiApiKey: '',
  openaiModel: 'gpt-4o-mini',
};

export interface AIEndpointPreset {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  defaultModel: string;
  needsKey: boolean;
  keyPlaceholder: string;
}

export const ENDPOINT_PRESETS: AIEndpointPreset[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'Official OpenAI cloud API',
    endpoint: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    needsKey: true,
    keyPlaceholder: 'sk-proj-...',
  },
  {
    id: 'ollama',
    name: 'Ollama (Local)',
    description: 'Local LLMs on your machine (port 11434)',
    endpoint: 'http://localhost:11434/v1',
    defaultModel: 'llama3.2',
    needsKey: false,
    keyPlaceholder: 'Optional (not required for Ollama)',
  },
  {
    id: 'lmstudio',
    name: 'LM Studio (Local)',
    description: 'Local inference server (port 1234)',
    endpoint: 'http://localhost:1234/v1',
    defaultModel: 'local-model',
    needsKey: false,
    keyPlaceholder: 'Optional (not required for LM Studio)',
  },
  {
    id: 'groq',
    name: 'Groq Cloud',
    description: 'Ultra-low latency LPU cloud inference',
    endpoint: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
    needsKey: true,
    keyPlaceholder: 'gsk_...',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    description: 'DeepSeek reasoning & chat models',
    endpoint: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    needsKey: true,
    keyPlaceholder: 'sk-...',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    description: 'Multi-provider unified API gateway',
    endpoint: 'https://openrouter.ai/api/v1',
    defaultModel: 'meta-llama/llama-3.2-3b-instruct',
    needsKey: true,
    keyPlaceholder: 'sk-or-...',
  },
  {
    id: 'custom',
    name: 'Custom / Self-Hosted',
    description: 'vLLM, LocalAI, Jan, or custom proxy',
    endpoint: 'http://localhost:8000/v1',
    defaultModel: 'custom-model',
    needsKey: false,
    keyPlaceholder: 'API key if required',
  },
];

export class AIService {
  /**
   * Load current AI configuration from localStorage with env fallback.
   */
  static getConfig(): AIConfig {
    const envGeminiKey =
      (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || '';
    const legacyGeminiKey =
      typeof window !== 'undefined'
        ? localStorage.getItem('zenmind_gemini_api_key') || ''
        : '';

    try {
      const stored =
        typeof window !== 'undefined'
          ? localStorage.getItem('zenmind_ai_config')
          : null;
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...DEFAULT_AI_CONFIG,
          ...parsed,
          geminiApiKey: parsed.geminiApiKey || legacyGeminiKey || envGeminiKey,
        };
      }
    } catch {
      // ignore
    }

    return {
      ...DEFAULT_AI_CONFIG,
      geminiApiKey: legacyGeminiKey || envGeminiKey,
    };
  }

  /**
   * Save AI configuration to localStorage.
   */
  static saveConfig(config: AIConfig) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('zenmind_ai_config', JSON.stringify(config));
    if (config.geminiApiKey) {
      localStorage.setItem('zenmind_gemini_api_key', config.geminiApiKey);
    }
  }

  /**
   * Universal JSON cleaner for LLM output (removes markdown backticks and preamble).
   */
  private static parseJsonFromResponse(raw: string): any {
    let text = raw.trim();

    // 1. Strip markdown code fence (```json ... ``` or ``` ... ```)
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      text = codeBlockMatch[1].trim();
    } else {
      // 2. Extract substring between first { or [ and matching last } or ]
      const firstCurly = text.indexOf('{');
      const firstSquare = text.indexOf('[');
      const isObject =
        firstCurly !== -1 && (firstSquare === -1 || firstCurly < firstSquare);

      if (isObject) {
        const lastCurly = text.lastIndexOf('}');
        if (lastCurly > firstCurly) {
          text = text.substring(firstCurly, lastCurly + 1);
        }
      } else if (firstSquare !== -1) {
        const lastSquare = text.lastIndexOf(']');
        if (lastSquare > firstSquare) {
          text = text.substring(firstSquare, lastSquare + 1);
        }
      }
    }

    return JSON.parse(text);
  }

  /**
   * Dispatch a chat completion request to an OpenAI-compatible endpoint.
   */
  private static async callOpenAI(
    messages: { role: string; content: string }[],
    config: AIConfig
  ): Promise<string> {
    const baseUrl = (
      config.openaiEndpoint || 'https://api.openai.com/v1'
    ).replace(/\/+$/, '');
    const url = `${baseUrl}/chat/completions`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (config.openaiApiKey && config.openaiApiKey.trim()) {
      headers['Authorization'] = `Bearer ${config.openaiApiKey.trim()}`;
    }

    const payload = {
      model: config.openaiModel || 'gpt-4o-mini',
      messages,
      temperature: 0.7,
    };

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(
        `OpenAI request failed (${res.status} ${res.statusText}): ${errText || 'Unknown error'}`
      );
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('OpenAI endpoint returned empty message content');
    }
    return content;
  }

  /**
   * Dispatch a chat completion request to Google Gemini API.
   */
  private static async callGemini(
    prompt: string,
    config: AIConfig
  ): Promise<string> {
    const apiKey = config.geminiApiKey || '';
    if (!apiKey) {
      throw new Error('Google Gemini API Key is not set.');
    }
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: config.geminiModel || 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || '';
  }

  /**
   * Generate an entire hierarchical mind map from a user prompt.
   */
  static async generateMindMapFromPrompt(
    topic: string,
    customConfig?: AIConfig
  ): Promise<GeneratedMindMapNode> {
    const config = customConfig || this.getConfig();

    const systemPrompt = `You are a professional mind mapping architect. Given a topic, create a structured hierarchical mind map in pure JSON format.
Output ONLY valid JSON with this exact schema without markdown backticks or explanations:
{
  "data": { "text": "Topic Title" },
  "children": [
    {
      "data": { "text": "Main Branch 1" },
      "children": [
        { "data": { "text": "Subtopic 1.1" } },
        { "data": { "text": "Subtopic 1.2" } }
      ]
    }
  ]
}
Create 3-5 main branches and 2-4 subtopics per branch. Keep text concise (2-5 words per node).`;

    // 1. OpenAI-compatible endpoint (Ollama, LM Studio, Groq, DeepSeek, OpenAI)
    if (config.provider === 'openai-compatible') {
      try {
        const raw = await this.callOpenAI(
          [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Topic: ${topic}` },
          ],
          config
        );
        const parsed = this.parseJsonFromResponse(raw);
        if (parsed.data && parsed.data.text) {
          return parsed;
        }
      } catch (err: any) {
        console.warn('OpenAI generation error:', err);
        throw err;
      }
    }

    // 2. Google Gemini
    if (config.provider === 'gemini' && config.geminiApiKey) {
      try {
        const raw = await this.callGemini(
          `${systemPrompt}\n\nTopic: ${topic}`,
          config
        );
        const parsed = this.parseJsonFromResponse(raw);
        if (parsed.data && parsed.data.text) {
          return parsed;
        }
      } catch (err: any) {
        console.warn('Gemini generation error, falling back:', err);
        // If API key failed, fall through to fallback
      }
    }

    // 3. Fallback structure if offline or no key
    return this.getFallbackMindMap(topic);
  }

  /**
   * Expand a single topic node with 4-5 relevant subtopic branches.
   */
  static async expandTopic(
    parentTopic: string,
    customConfig?: AIConfig
  ): Promise<string[]> {
    const config = customConfig || this.getConfig();

    const prompt = `Provide 4-5 relevant, concise subtopic ideas for a mind map branch labeled: "${parentTopic}".
Output ONLY a JSON array of strings, e.g. ["Subtopic 1", "Subtopic 2", "Subtopic 3", "Subtopic 4"]. No extra commentary.`;

    if (config.provider === 'openai-compatible') {
      try {
        const raw = await this.callOpenAI(
          [
            {
              role: 'system',
              content:
                'You are a mind map assistant. Output ONLY a valid JSON array of strings.',
            },
            { role: 'user', content: prompt },
          ],
          config
        );
        const parsed = this.parseJsonFromResponse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (err: any) {
        console.warn('OpenAI topic expansion error:', err);
        throw err;
      }
    }

    if (config.provider === 'gemini' && config.geminiApiKey) {
      try {
        const raw = await this.callGemini(prompt, config);
        const parsed = this.parseJsonFromResponse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (err: any) {
        console.warn('Gemini topic expansion error, falling back:', err);
      }
    }

    return this.getFallbackSubtopics(parentTopic);
  }

  /**
   * Quick connection diagnostic to test API reachable status and model responsiveness.
   */
  static async testConnection(
    config: AIConfig
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (config.provider === 'gemini') {
        if (!config.geminiApiKey) {
          return { success: false, message: 'Gemini API key is required.' };
        }
        const text = await this.callGemini(
          'Ping test. Reply with: OK',
          config
        );
        return {
          success: true,
          message: `Connected successfully to Gemini (${config.geminiModel || 'gemini-2.5-flash'}). Response: "${text.trim().substring(0, 30)}"`,
        };
      } else {
        const text = await this.callOpenAI(
          [{ role: 'user', content: 'Ping test. Reply with: OK' }],
          config
        );
        return {
          success: true,
          message: `Connected successfully to ${config.openaiModel || 'model'} at ${config.openaiEndpoint}. Response: "${text.trim().substring(0, 30)}"`,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Connection failed.',
      };
    }
  }

  /**
   * Intelligent offline template fallback.
   */
  static getFallbackMindMap(topic: string): GeneratedMindMapNode {
    return {
      data: { text: topic },
      children: [
        {
          data: { text: 'Key Concepts & Foundation' },
          children: [
            { data: { text: 'Definitions & Scope' } },
            { data: { text: 'Core Principles' } },
            { data: { text: 'Prerequisites' } },
          ],
        },
        {
          data: { text: 'Strategy & Execution' },
          children: [
            { data: { text: 'Planning & Milestones' } },
            { data: { text: 'Resource Allocation' } },
            { data: { text: 'Action Items' } },
          ],
        },
        {
          data: { text: 'Best Practices' },
          children: [
            { data: { text: 'Standards & Workflows' } },
            { data: { text: 'Common Pitfalls' } },
            { data: { text: 'Quality Assurance' } },
          ],
        },
        {
          data: { text: 'Future Growth & Metrics' },
          children: [
            { data: { text: 'KPIs & Monitoring' } },
            { data: { text: 'Next Steps & Scaling' } },
          ],
        },
      ],
    };
  }

  static getFallbackSubtopics(parentTopic: string): string[] {
    return [
      `Key Insights on ${parentTopic}`,
      `Practical Steps`,
      `Dependencies & Risks`,
      `Expected Deliverables`,
    ];
  }
}
