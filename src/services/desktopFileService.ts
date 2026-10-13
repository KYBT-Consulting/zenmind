import { open, save } from '@tauri-apps/plugin-dialog';
import { readFile, readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';

export interface FileSaveResult {
  success: boolean;
  filePath?: string;
  canceled?: boolean;
  error?: any;
}

export interface FileOpenResult {
  success: boolean;
  filePath?: string;
  content?: string;
  /** Raw bytes, set for binary formats (.xmind) that can't be read as text */
  bytes?: Uint8Array;
  canceled?: boolean;
  error?: any;
}

export class DesktopFileService {
  /**
   * Detects if the app is running inside a native Tauri desktop environment.
   */
  static isTauri(): boolean {
    return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
  }

  /**
   * Native file save dialog and direct disk write (Tauri) with browser fallback.
   */
  static async saveZenMindFile(
    data: any,
    suggestedName: string = 'Untitled',
    existingFilePath?: string
  ): Promise<FileSaveResult> {
    const payload = JSON.stringify(
      {
        version: '1.0.0',
        title: suggestedName,
        savedAt: new Date().toISOString(),
        content: data,
      },
      null,
      2
    );

    if (this.isTauri()) {
      try {
        let filePath = existingFilePath;

        // If no existing path, prompt native save dialog
        if (!filePath) {
          const selected = await save({
            title: 'Save ZenMind Project',
            defaultPath: `${suggestedName}.zenmind`,
            filters: [
              {
                name: 'ZenMind Mind Map',
                extensions: ['zenmind', 'json'],
              },
            ],
          });

          if (!selected) {
            return { success: false, canceled: true };
          }
          filePath = selected;
        }

        // Write directly to disk
        await writeTextFile(filePath, payload);
        return { success: true, filePath };
      } catch (error) {
        console.error('Tauri native save error:', error);
        return { success: false, error };
      }
    }

    // Web fallback: standard Blob download
    try {
      const blob = new Blob([payload], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${suggestedName.trim() || 'mindmap'}.zenmind`;
      a.click();
      URL.revokeObjectURL(url);
      return { success: true };
    } catch (error) {
      console.error('Browser save error:', error);
      return { success: false, error };
    }
  }

  /**
   * Native file open dialog and direct disk read (Tauri) with browser fallback.
   */
  static async openZenMindFile(): Promise<FileOpenResult> {
    if (this.isTauri()) {
      try {
        const selected = await open({
          title: 'Open Mind Map Document',
          multiple: false,
          directory: false,
          filters: [
            {
              name: 'Supported Mind Maps (*.zenmind, *.json, *.xmind, *.md, *.opml, *.mm)',
              extensions: ['zenmind', 'json', 'xmind', 'md', 'markdown', 'opml', 'mm'],
            },
            {
              name: 'ZenMind / JSON Projects (*.zenmind, *.json)',
              extensions: ['zenmind', 'json'],
            },
            {
              name: 'XMind Archives (*.xmind)',
              extensions: ['xmind'],
            },
            {
              name: 'Markdown Documents (*.md, *.markdown)',
              extensions: ['md', 'markdown'],
            },
            {
              name: 'OPML Outlines (*.opml)',
              extensions: ['opml'],
            },
            {
              name: 'FreeMind XML (*.mm)',
              extensions: ['mm'],
            },
          ],
        });

        if (!selected || typeof selected !== 'string') {
          return { success: false, canceled: true };
        }

        if (selected.toLowerCase().endsWith('.xmind')) {
          const bytes = await readFile(selected);
          return { success: true, filePath: selected, bytes };
        }
        const content = await readTextFile(selected);
        return { success: true, filePath: selected, content };
      } catch (error) {
        console.error('Tauri native open error:', error);
        return { success: false, error };
      }
    }

    // On web, callers should trigger standard HTML file input
    return { success: false, error: 'Web requires file input trigger' };
  }
}
