import { describe, expect, it } from 'vitest';
import {
  applyInlineMarkdown,
  applyTextHighlightTint,
  extractLatexFormulas,
  HIGHLIGHT_TINTS,
} from './inlineMarkdown';

describe('inlineMarkdown', () => {
  it('converts **bold**, *italic*, `code`, ~~strike~~, and ==highlight== inside HTML text nodes', () => {
    const input = '<p>Hello **world** and *zen* with `const x = 1` plus ~~old~~ and ==important==</p>';
    const out = applyInlineMarkdown(input);
    expect(out).toContain('<strong>world</strong>');
    expect(out).toContain('<em>zen</em>');
    expect(out).toContain('<code');
    expect(out).toContain('const x = 1</code>');
    expect(out).toContain('<s>old</s>');
    expect(out).toContain('data-zenmind-highlight="yellow"');
    expect(out).toContain('>important</span>');
  });

  it('converts [!NOTE], [!TIP], [!IMPORTANT], [!WARNING], and [!CAUTION] callout shortcodes', () => {
    const out = applyInlineMarkdown('<p>[!WARNING] Check memory bounds</p>');
    expect(out).toContain('data-zenmind-callout="WARNING"');
    expect(out).toContain('[WARNING]');
  });

  it('applies and clears text highlighter tints', () => {
    const tinted = applyTextHighlightTint('<p>Key Insight</p>', HIGHLIGHT_TINTS[1]);
    expect(tinted).toContain('data-zenmind-highlight="mint"');
    expect(tinted).toContain('#bbf7d0');

    const cleared = applyTextHighlightTint(tinted, null);
    expect(cleared).toBe('<p>Key Insight</p>');
  });

  it('extracts LaTeX formulas from ql-formula spans, annotations, and inline $...$', () => {
    const html =
      '<p><span class="ql-formula" data-value="E = mc^2"></span> and $a^2 + b^2 = c^2$</p>';
    expect(extractLatexFormulas(html)).toEqual(['E = mc^2', 'a^2 + b^2 = c^2']);
  });
});
