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
