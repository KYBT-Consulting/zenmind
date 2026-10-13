import { DesktopFileService } from './desktopFileService';

export interface FolderNodeData {
  data: {
    text: string;
    expand?: boolean;
    hyperlink?: string;
    tag?: string[];
  };
  children?: FolderNodeData[];
}

const IGNORED_NAMES = new Set([
  'node_modules',
  '.git',
  '.svn',
  '.vscode',
  '.idea',
  'dist',
  'build',
  'target',
  '.tauri',
  'coverage',
  '.DS_Store',
]);

export class FolderImportService {
  /**
   * Imports a local folder and transforms its file/directory tree into a MindMap structure.
   */
  static async importFolder(): Promise<{ success: boolean; data?: FolderNodeData; folderName?: string; error?: string }> {
    if (DesktopFileService.isTauri()) {
      return this.importFolderNative();
    } else {
      return this.importFolderWeb();
    }
  }

  /**
   * Native Tauri folder picker and recursive filesystem scanner.
   */
  private static async importFolderNative(): Promise<{ success: boolean; data?: FolderNodeData; folderName?: string; error?: string }> {
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select Folder to Map',
      });

      if (!selected || typeof selected !== 'string') {
        return { success: false };
      }

      const folderPath = selected;
      const folderName = folderPath.split(/[/\\]/).filter(Boolean).pop() || 'Project Folder';

      const { readDir } = await import('@tauri-apps/plugin-fs');

      const scanDir = async (path: string, depth = 0, maxDepth = 4): Promise<FolderNodeData[]> => {
        if (depth > maxDepth) return [];

        const entries = await readDir(path);
        const children: FolderNodeData[] = [];

        // Sort: directories first, then files
        entries.sort((a, b) => {
          if (a.isDirectory && !b.isDirectory) return -1;
          if (!a.isDirectory && b.isDirectory) return 1;
          return a.name.localeCompare(b.name);
        });

        for (const entry of entries) {
          if (IGNORED_NAMES.has(entry.name)) continue;

          const childPath = `${path}/${entry.name}`;

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
      };
    } catch (err: any) {
      console.error('Tauri folder import error:', err);
      return { success: false, error: err?.message || 'Failed to read directory' };
    }
  }

  /**
   * Web fallback using hidden file input with webkitdirectory attribute.
   */
  private static async importFolderWeb(): Promise<{ success: boolean; data?: FolderNodeData; folderName?: string; error?: string }> {
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

        // Build tree from relative paths
        const rootName = files[0].webkitRelativePath.split('/')[0] || 'Imported Folder';
        const root: FolderNodeData = {
          data: { text: `📁 ${rootName}`, expand: true, tag: ['Directory Map'] },
          children: [],
        };

        const map = new Map<string, FolderNodeData>();
        map.set('', root);

        for (let i = 0; i < files.length; i++) {
          const pathParts = files[i].webkitRelativePath.split('/');
          pathParts.shift(); // Remove root folder name

          let currentPath = '';
          for (let p = 0; p < pathParts.length; p++) {
            const part = pathParts[p];
            if (IGNORED_NAMES.has(part)) break;

            const isFile = p === pathParts.length - 1;
            const nextPath = currentPath ? `${currentPath}/${part}` : part;

            if (!map.has(nextPath)) {
              const node: FolderNodeData = {
                data: {
                  text: isFile ? `📄 ${part}` : `📁 ${part}`,
                  expand: p < 2,
                },
                children: isFile ? undefined : [],
              };
              const parentNode = map.get(currentPath)!;
              if (!parentNode.children) parentNode.children = [];
              parentNode.children.push(node);
              map.set(nextPath, node);
            }
            currentPath = nextPath;
          }
        }

        document.body.removeChild(input);
        resolve({ success: true, data: root, folderName: rootName });
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
