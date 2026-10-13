import { DesktopFileService } from './desktopFileService';
import {
  buildTreeFromRelativePaths,
  FolderNodeData,
  IGNORED_NAMES,
  joinNativePath,
  MAX_FOLDER_ENTRIES,
} from '../lib/folderTree';

export type { FolderNodeData };

export interface FolderImportResult {
  success: boolean;
  data?: FolderNodeData;
  folderName?: string;
  error?: string;
  /** Set when the import succeeded but is incomplete (skipped folders, entry cap) */
  warning?: string;
}

export class FolderImportService {
  /**
   * Imports a local folder and transforms its file/directory tree into a MindMap structure.
   */
  static async importFolder(): Promise<FolderImportResult> {
    if (DesktopFileService.isTauri()) {
      return this.importFolderNative();
    } else {
      return this.importFolderWeb();
    }
  }

  /**
   * Native Tauri v3 folder picker and recursive filesystem scanner.
   */
  private static async importFolderNative(): Promise<FolderImportResult> {
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const selected = await open({
        directory: true,
        multiple: false,
        // The scan reads subfolders, so the picked folder must be granted recursively
        recursive: true,
        title: 'Select Folder to Map',
      });

      if (!selected || typeof selected !== 'string') {
        return { success: false };
      }

      const folderPath = selected;
      const folderName = folderPath.split(/[/\\]/).filter(Boolean).pop() || 'Project Folder';

      const { readDir } = await import('@tauri-apps/plugin-fs');

      const skipped: string[] = [];
      let entryCount = 0;
      let truncated = false;

      const scanDir = async (path: string, depth = 0, maxDepth = 4): Promise<FolderNodeData[]> => {
        if (depth > maxDepth || truncated) return [];

        let entries;
        try {
          entries = await readDir(path);
        } catch (err) {
          // One unreadable folder (permissions, broken link) must not abort the whole import
          console.warn('Folder import: skipping unreadable directory', path, err);
          skipped.push(path);
          return [];
        }
        const children: FolderNodeData[] = [];

        // Sort: directories first, then files
        entries.sort((a, b) => {
          if (a.isDirectory && !b.isDirectory) return -1;
          if (!a.isDirectory && b.isDirectory) return 1;
          return a.name.localeCompare(b.name);
        });

        for (const entry of entries) {
          if (IGNORED_NAMES.has(entry.name)) continue;
          if (entryCount >= MAX_FOLDER_ENTRIES) {
            truncated = true;
            break;
          }
          entryCount++;

          const childPath = joinNativePath(path, entry.name);

          if (entry.isDirectory) {
            const subChildren = await scanDir(childPath, depth + 1, maxDepth);
            children.push({
              data: {
                text: `📁 ${entry.name}`,
                expand: depth < 2,
              },
              children: subChildren,
            });
          } else {
            children.push({
              data: {
                text: `📄 ${entry.name}`,
                hyperlink: childPath,
              },
            });
          }
        }

        return children;
      };

      const children = await scanDir(folderPath, 0, 4);

      const warnings: string[] = [];
      if (truncated) warnings.push(`The folder is large: only the first ${MAX_FOLDER_ENTRIES} entries were mapped.`);
      if (skipped.length > 0) {
        warnings.push(`${skipped.length} folder(s) could not be read and were skipped.`);
      }

      const rootTree: FolderNodeData = {
        data: {
          text: `📁 ${folderName}`,
          expand: true,
          tag: ['Directory Map'],
        },
        children,
      };

      return {
        success: true,
        data: rootTree,
        folderName,
        warning: warnings.length ? warnings.join(' ') : undefined,
      };
    } catch (err: any) {
      console.error('Tauri folder import error:', err);
      return { success: false, error: err?.message || 'Failed to read directory' };
    }
  }

  /**
   * Web fallback using hidden file input with webkitdirectory attribute.
   */
  private static async importFolderWeb(): Promise<FolderImportResult> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      // @ts-ignore
      input.webkitdirectory = true;
      input.multiple = true;
      input.style.display = 'none';

      input.onchange = (e: any) => {
        const files: FileList = e.target.files;
        if (!files || files.length === 0) {
          resolve({ success: false });
          return;
        }

        const paths = Array.from(files, (f) => f.webkitRelativePath);
        const { root, rootName, truncated } = buildTreeFromRelativePaths(paths);

        document.body.removeChild(input);
        resolve({
          success: true,
          data: root,
          folderName: rootName,
          warning: truncated
            ? `The folder is large: only the first ${MAX_FOLDER_ENTRIES} entries were mapped.`
            : undefined,
        });
      };

      input.oncancel = () => {
        document.body.removeChild(input);
        resolve({ success: false });
      };

      document.body.appendChild(input);
      input.click();
    });
  }
}
