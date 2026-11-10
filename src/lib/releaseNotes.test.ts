import { describe, expect, it } from 'vitest';
import { releaseNotesToPlainText } from './releaseNotes';

const BODY = `## What's new in ZenMind v0.3.1

### Fixed
- **Reopen files from disk:** saved files are reread at launch, not restored from a cache.
- Save on a \`.md\` file asks for a \`.zenmind\` location. See [the docs](https://example.com/docs).

> **Upgrading:** install *once* by hand.

---
[Full changelog](https://github.com/x/y) · [Try ZenMind on the web](https://example.com)

Built with ❤️ by [KYBT Consulting](https://kybtconsulting.com).`;

describe('releaseNotesToPlainText', () => {
  it('produces readable plain text for the update notice', () => {
    expect(releaseNotesToPlainText(BODY)).toBe(
      [
        'Fixed',
        '• Reopen files from disk: saved files are reread at launch, not restored from a cache.',
        '• Save on a .md file asks for a .zenmind location. See the docs.',
        '',
        'Upgrading: install once by hand.',
      ].join('\n')
    );
  });

  it('drops the footer and the redundant title', () => {
    const out = releaseNotesToPlainText(BODY);
    expect(out).not.toMatch(/What's new|Full changelog|Built with|github\.com/);
  });

  it('keeps notes without a footer intact and tolerates CRLF', () => {
    expect(releaseNotesToPlainText('### Added\r\n- One\r\n- Two')).toBe('Added\n• One\n• Two');
  });

  it('leaves plain text alone (e.g. the fallback line)', () => {
    expect(releaseNotesToPlainText("See the changelog for what's new in this release.")).toBe(
      "See the changelog for what's new in this release."
    );
  });

  it('does not mangle snake_case or asterisks used as math', () => {
    expect(releaseNotesToPlainText('- renamed tauri.updater_conf and 2 * 3 * 4')).toBe(
      '• renamed tauri.updater_conf and 2 * 3 * 4'
    );
  });
});
