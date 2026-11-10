import { check, type Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { invoke } from '@tauri-apps/api/core';
import { DesktopFileService } from './desktopFileService';

export const RELEASES_URL = 'https://github.com/KYBT-Consulting/zenmind/releases/latest';
const AUTO_CHECK_KEY = 'zenmind_auto_update_check';
/** Give up on an update check after this long; checks are always user-retryable. */
export const UPDATE_CHECK_TIMEOUT_MS = 15_000;

export interface UpdateInfo {
  version: string;
  currentVersion: string;
  notes?: string;
  date?: string;
  /**
   * False for the Windows portable ZIP: its exe carries the installer's bundle type,
   * so installing would add a second, installed copy instead of updating the portable one.
   * The UI offers a download link instead.
   */
  canInstall: boolean;
  downloadUrl: string;
}

/**
 * Desktop self-update via the Tauri updater plugin. Updates are signed; the plugin
 * verifies each download against the public key in tauri.conf.json before installing.
 */
export class UpdateService {
  private static pending: Update | null = null;

  /** Updates only exist for the desktop app; the web build is always current. */
  static isSupported(): boolean {
    return DesktopFileService.isTauri();
  }

  static getAutoCheck(): boolean {
    try {
      return localStorage.getItem(AUTO_CHECK_KEY) !== 'false';
    } catch {
      return true;
    }
  }

  static setAutoCheck(enabled: boolean): void {
    try {
      localStorage.setItem(AUTO_CHECK_KEY, String(enabled));
    } catch {
      // storage unavailable: the default (enabled) applies next launch
    }
  }

  /** Resolves with the available update, or null when up to date. Throws on network/config errors. */
  static async checkForUpdate(): Promise<UpdateInfo | null> {
    if (!this.isSupported()) return null;

    const update = await check({ timeout: UPDATE_CHECK_TIMEOUT_MS });
    if (!update) {
      this.pending = null;
      return null;
    }
    this.pending = update;

    const portable = await invoke<boolean>('is_portable_install').catch(() => false);
    return {
      version: update.version,
      currentVersion: update.currentVersion,
      notes: update.body,
      date: update.date,
      canInstall: !portable,
      downloadUrl: RELEASES_URL,
    };
  }

  /**
   * Download, verify, and install the update found by the last check, then restart.
   * `onProgress` receives 0..1, or null while the total size is unknown.
   * On Windows the installer closes the app itself before relaunch is reached.
   */
  static async installAndRestart(onProgress?: (fraction: number | null) => void): Promise<void> {
    const update = this.pending;
    if (!update) throw new Error('No update is ready to install. Check for updates first.');

    let total = 0;
    let received = 0;
    await update.downloadAndInstall((event) => {
      switch (event.event) {
        case 'Started':
          total = event.data.contentLength ?? 0;
          onProgress?.(total ? 0 : null);
          break;
        case 'Progress':
          received += event.data.chunkLength;
          onProgress?.(total ? Math.min(received / total, 1) : null);
          break;
        case 'Finished':
          onProgress?.(1);
          break;
      }
    });
    await relaunch();
  }
}
