import { confirm as nativeConfirm, open, save } from '@tauri-apps/plugin-dialog';
import { readFile, readTextFile, writeFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { exportContentToBytes, exportFileType, toSafeFilename } from '../lib/exportFile';
import { fileFingerprint } from '../lib/fingerprint';

export interface FileSaveResult {
  success: boolean;
  filePath?: string;
  /** Fingerprint of what was written (desktop), to detect later changes made elsewhere */
  fingerprint?: string;
  canceled?: boolean;
  error?: any;
}

export interface FileOpenResult {
  success: boolean;
  filePath?: string;
  content?: string;
  /** Raw bytes, set for binary formats (.xmind) that can't be read as text */
  bytes?: Uint8Array;
  /** Fingerprint of the raw file contents, to detect later changes made elsewhere */
  fingerprint?: string;
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
   * OK/Cancel prompt that works on both runtimes. The Tauri dialog plugin replaces
   * `window.confirm` with an async version that returns a Promise, so code doing
   * `if (!window.confirm(...))` silently proceeds on desktop. Always await this instead.
   */
  static async confirm(message: string, title = 'ZenMind'): Promise<boolean> {
    if (this.isTauri()) {
      return nativeConfirm(message, { title, kind: 'warning' });
    }
    return window.confirm(message);
  }

  /**
   * Browsers reserve Ctrl/Cmd+N (new window) and page scripts can't intercept it, so the web
   * build uses Alt+N; the desktop app uses Ctrl/Cmd+N.
   */
  static newMapShortcut(): { label: string; matches: (e: KeyboardEvent) => boolean } {
    if (this.isTauri()) {
      return { label: 'Ctrl+N', matches: (e) => (e.ctrlKey || e.metaKey) && e.code === 'KeyN' };
    }
    return { label: 'Alt+N', matches: (e) => e.altKey && !e.ctrlKey && !e.metaKey && e.code === 'KeyN' };
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
        return { success: true, filePath, fingerprint: fileFingerprint(payload) };
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
      document.body.appendChild(a);
      a.click();
      a.remove();
      // Revoking immediately can cancel the download in some browsers
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      return { success: true };
    } catch (error) {
      console.error('Browser save error:', error);
      return { success: false, error };
    }
  }

  /**
   * Save exported content (a `data:` URL or plain text) under `<title>.<ext>`.
   * Desktop: asks for a location with the native save dialog, then writes the bytes.
   * Web: triggers a normal browser download.
   */
  static async saveExport(content: string, title: string, ext: string): Promise<FileSaveResult> {
    const filename = `${toSafeFilename(title)}.${ext}`;
    const { label, mime } = exportFileType(ext);
    const bytes = exportContentToBytes(content);

    if (this.isTauri()) {
      const selected = await save({
        title: 'Export Mind Map',
        defaultPath: filename,
        filters: [{ name: label, extensions: [ext] }],
      });
      if (!selected) return { success: false, canceled: true };

      await writeFile(selected, bytes);
      return { success: true, filePath: selected };
    }

    const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: mime }));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Revoking immediately can cancel the download in some browsers
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    return { success: true };
  }

  /**
   * Read a mind map file from disk by path (desktop only). Binary formats (.xmind)
   * come back as bytes, everything else as text. Used by the Open dialog and to
   * reopen the previous session's files on launch.
   */
  static async readMapFile(filePath: string): Promise<FileOpenResult> {
    if (filePath.toLowerCase().endsWith('.xmind')) {
      const bytes = await readFile(filePath);
      return { success: true, filePath, bytes, fingerprint: fileFingerprint(bytes) };
    }
    const content = await readTextFile(filePath);
    return { success: true, filePath, content, fingerprint: fileFingerprint(content) };
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

        return await this.readMapFile(selected);
      } catch (error) {
        console.error('Tauri native open error:', error);
        return { success: false, error };
      }
    }

    // On web, callers should trigger standard HTML file input
    return { success: false, error: 'Web requires file input trigger' };
  }
}
