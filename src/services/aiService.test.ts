import { beforeEach, describe, expect, it } from 'vitest';
import { AIService, DEFAULT_GEMINI_MODEL, resolveGeminiModel } from './aiService';

describe('resolveGeminiModel', () => {
  it('falls back to the moving alias when no model is set', () => {
    expect(DEFAULT_GEMINI_MODEL).toBe('gemini-flash-latest');
    expect(resolveGeminiModel('')).toBe(DEFAULT_GEMINI_MODEL);
    expect(resolveGeminiModel('   ')).toBe(DEFAULT_GEMINI_MODEL);
    expect(resolveGeminiModel(undefined)).toBe(DEFAULT_GEMINI_MODEL);
  });

  it('keeps an explicitly pinned model', () => {
    expect(resolveGeminiModel(' gemini-3.8-flash ')).toBe('gemini-3.8-flash');
  });
});

describe('AIService.getConfig model migration', () => {
  beforeEach(() => localStorage.clear());

  const save = (cfg: Record<string, unknown>) =>
    localStorage.setItem('zenmind_ai_config', JSON.stringify(cfg));

  it('uses the alias for a fresh install', () => {
    expect(AIService.getConfig().geminiModel).toBe(DEFAULT_GEMINI_MODEL);
  });

  it('moves configs saved with the retired gemini-2.5-flash default to the alias', () => {
    save({ provider: 'gemini', geminiApiKey: 'k', geminiModel: 'gemini-2.5-flash' });
    const cfg = AIService.getConfig();
    expect(cfg.geminiModel).toBe(DEFAULT_GEMINI_MODEL);
    expect(cfg.geminiApiKey).toBe('k');
  });

  it('replaces a blank saved model with the alias', () => {
    save({ provider: 'gemini', geminiModel: '' });
    expect(AIService.getConfig().geminiModel).toBe(DEFAULT_GEMINI_MODEL);
  });

  it('keeps a user-pinned model', () => {
    save({ provider: 'gemini', geminiModel: 'gemini-3.8-flash' });
    expect(AIService.getConfig().geminiModel).toBe('gemini-3.8-flash');
  });
});

describe('Gemini client setup', () => {
  it('pins the v1beta API so -latest aliases resolve', async () => {
    const { vi } = await import('vitest');
    vi.resetModules();
    const ctorArgs: any[] = [];
    vi.doMock('@google/genai', () => ({
      GoogleGenAI: class {
        constructor(opts: any) {
          ctorArgs.push(opts);
        }
        models = { generateContent: async () => ({ text: 'OK', modelVersion: 'gemini-3.8-flash' }) };
      },
    }));
    const { AIService: Fresh, GEMINI_API_VERSION } = await import('./aiService');
    const res = await Fresh.testConnection({
      ...Fresh.getConfig(),
      provider: 'gemini',
      geminiApiKey: 'test-key',
      geminiModel: 'gemini-flash-latest',
    });
    expect(GEMINI_API_VERSION).toBe('v1beta');
    expect(ctorArgs[0]).toMatchObject({ apiKey: 'test-key', apiVersion: 'v1beta' });
    expect(res.success).toBe(true);
    expect(res.message).toContain('gemini-flash-latest → gemini-3.8-flash');
    vi.doUnmock('@google/genai');
  });
});

describe('testConnection timeout', () => {
  /** A request that never settles on its own, only when its signal aborts. */
  const hangUntilAborted = (signal?: AbortSignal) =>
    new Promise((_, reject) => {
      signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
    });

  it('gives up on a hung Gemini request and cancels it', async () => {
    const { vi } = await import('vitest');
    vi.resetModules();
    const seen: { signal?: AbortSignal } = {};
    vi.doMock('@google/genai', () => ({
      GoogleGenAI: class {
        models = {
          generateContent: (req: any) => {
            seen.signal = req.config?.abortSignal;
            return hangUntilAborted(seen.signal);
          },
        };
      },
    }));
    const { AIService: Fresh } = await import('./aiService');
    const res = await Fresh.testConnection(
      { ...Fresh.getConfig(), provider: 'gemini', geminiApiKey: 'k' },
      50
    );
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/No response after .* try again/);
    expect(seen.signal?.aborted).toBe(true);
    vi.doUnmock('@google/genai');
  });

  it('gives up on a hung OpenAI-compatible request and cancels it', async () => {
    const { vi } = await import('vitest');
    const seen: { signal?: AbortSignal } = {};
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation((_url, init) => {
        seen.signal = init?.signal ?? undefined;
        return hangUntilAborted(seen.signal) as Promise<Response>;
      });
    const res = await AIService.testConnection(
      { ...AIService.getConfig(), provider: 'openai-compatible', openaiEndpoint: 'http://localhost:11434/v1' },
      50
    );
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/No response after/);
    expect(seen.signal?.aborted).toBe(true);
    fetchSpy.mockRestore();
  });

  it('still reports real API errors (e.g. 503 high demand) without waiting for the timeout', async () => {
    const { vi } = await import('vitest');
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('model overloaded', { status: 503, statusText: 'Service Unavailable' }));
    const res = await AIService.testConnection(
      { ...AIService.getConfig(), provider: 'openai-compatible' },
      60_000
    );
    expect(res.success).toBe(false);
    expect(res.message).toContain('503');
    fetchSpy.mockRestore();
  });
});
