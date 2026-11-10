import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  check: vi.fn(),
  relaunch: vi.fn(),
  invoke: vi.fn(),
}));

vi.mock('@tauri-apps/plugin-updater', () => ({ check: mocks.check }));
vi.mock('@tauri-apps/plugin-process', () => ({ relaunch: mocks.relaunch }));
vi.mock('@tauri-apps/api/core', () => ({
  invoke: mocks.invoke,
  Channel: class {
    onmessage: (msg: unknown) => void = () => {};
  },
}));

import { RELEASES_URL, UPDATE_CHECK_TIMEOUT_MS, UpdateService } from './updateService';

const fakeUpdate = (events: any[] = []) => ({
  version: '0.2.9',
  currentVersion: '0.2.8',
  body: 'Release notes',
  date: '2026-11-11',
  downloadAndInstall: vi.fn(async (onEvent?: (e: any) => void) => {
    events.forEach((e) => onEvent?.(e));
  }),
});

describe('UpdateService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    (window as any).__TAURI_INTERNALS__ = {};
    // is_portable_install → false; update_install_strategy → 'plugin'
    mocks.invoke.mockImplementation(async (cmd: string) => (cmd === 'update_install_strategy' ? 'plugin' : false));
  });
  afterEach(() => {
    delete (window as any).__TAURI_INTERNALS__;
  });

  it('does nothing in the web build', async () => {
    delete (window as any).__TAURI_INTERNALS__;
    expect(UpdateService.isSupported()).toBe(false);
    expect(await UpdateService.checkForUpdate()).toBeNull();
    expect(mocks.check).not.toHaveBeenCalled();
  });

  it('checks with a timeout and reports an installable update', async () => {
    mocks.check.mockResolvedValue(fakeUpdate());
    const info = await UpdateService.checkForUpdate();
    expect(mocks.check).toHaveBeenCalledWith({ timeout: UPDATE_CHECK_TIMEOUT_MS });
    expect(info).toEqual({
      version: '0.2.9',
      currentVersion: '0.2.8',
      notes: 'Release notes',
      date: '2026-11-11',
      canInstall: true,
      downloadUrl: RELEASES_URL,
    });
  });

  it('returns null when already up to date', async () => {
    mocks.check.mockResolvedValue(null);
    expect(await UpdateService.checkForUpdate()).toBeNull();
  });

  it('never offers to install on the Windows portable build', async () => {
    mocks.check.mockResolvedValue(fakeUpdate());
    mocks.invoke.mockImplementation(async (cmd: string) => cmd === 'is_portable_install');
    const info = await UpdateService.checkForUpdate();
    expect(mocks.invoke).toHaveBeenCalledWith('is_portable_install');
    expect(info?.canInstall).toBe(false);
  });

  it('propagates check errors so the caller can offer a retry', async () => {
    mocks.check.mockRejectedValue(new Error('network down'));
    await expect(UpdateService.checkForUpdate()).rejects.toThrow('network down');
  });

  it('reports download progress, then relaunches', async () => {
    const update = fakeUpdate([
      { event: 'Started', data: { contentLength: 200 } },
      { event: 'Progress', data: { chunkLength: 50 } },
      { event: 'Progress', data: { chunkLength: 150 } },
      { event: 'Finished' },
    ]);
    mocks.check.mockResolvedValue(update);
    await UpdateService.checkForUpdate();

    const progress: (number | null)[] = [];
    await UpdateService.installAndRestart((p) => progress.push(p));
    expect(progress).toEqual([0, 0.25, 1, 1]);
    expect(update.downloadAndInstall).toHaveBeenCalledOnce();
    expect(mocks.relaunch).toHaveBeenCalledOnce();
  });

  it('reports indeterminate progress when the size is unknown', async () => {
    mocks.check.mockResolvedValue(
      fakeUpdate([
        { event: 'Started', data: {} },
        { event: 'Progress', data: { chunkLength: 10 } },
      ])
    );
    await UpdateService.checkForUpdate();
    const progress: (number | null)[] = [];
    await UpdateService.installAndRestart((p) => progress.push(p));
    expect(progress).toEqual([null, null]);
  });

  it('refuses to install before a successful check', async () => {
    mocks.check.mockResolvedValue(null);
    await UpdateService.checkForUpdate();
    await expect(UpdateService.installAndRestart()).rejects.toThrow(/Check for updates first/);
    expect(mocks.relaunch).not.toHaveBeenCalled();
  });

  it('does not relaunch if the download or signature check fails', async () => {
    const update = fakeUpdate();
    update.downloadAndInstall.mockRejectedValue(new Error('signature verification failed'));
    mocks.check.mockResolvedValue(update);
    await UpdateService.checkForUpdate();
    await expect(UpdateService.installAndRestart()).rejects.toThrow('signature verification failed');
    expect(mocks.relaunch).not.toHaveBeenCalled();
  });

  it('installs rpm updates through the app (RPM 6 rejects the plugin\'s plain rpm -U)', async () => {
    const update = fakeUpdate();
    mocks.check.mockResolvedValue(update);
    mocks.invoke.mockImplementation(async (cmd: string, args?: any) => {
      if (cmd === 'update_install_strategy') return 'rpm';
      if (cmd === 'install_rpm_update') {
        // the Rust side streams the same events as the plugin
        args.onEvent.onmessage({ event: 'Started', data: { contentLength: 100 } });
        args.onEvent.onmessage({ event: 'Progress', data: { chunkLength: 100 } });
        args.onEvent.onmessage({ event: 'Finished' });
        return null;
      }
      return false;
    });
    await UpdateService.checkForUpdate();
    const progress: (number | null)[] = [];
    await UpdateService.installAndRestart((p) => progress.push(p));

    expect(mocks.invoke).toHaveBeenCalledWith('install_rpm_update', expect.objectContaining({ onEvent: expect.anything() }));
    expect(update.downloadAndInstall).not.toHaveBeenCalled();
    expect(progress).toEqual([0, 1, 1]);
    expect(mocks.relaunch).toHaveBeenCalledOnce();
  });

  it('does not relaunch when the rpm install fails (e.g. password prompt canceled)', async () => {
    mocks.check.mockResolvedValue(fakeUpdate());
    mocks.invoke.mockImplementation(async (cmd: string) => {
      if (cmd === 'update_install_strategy') return 'rpm';
      if (cmd === 'install_rpm_update') throw 'The update was not installed: the password prompt was canceled.';
      return false;
    });
    await UpdateService.checkForUpdate();
    await expect(UpdateService.installAndRestart()).rejects.toMatch(/password prompt was canceled/);
    expect(mocks.relaunch).not.toHaveBeenCalled();
  });

  it('remembers the automatic-check preference (on by default)', () => {
    expect(UpdateService.getAutoCheck()).toBe(true);
    UpdateService.setAutoCheck(false);
    expect(UpdateService.getAutoCheck()).toBe(false);
    UpdateService.setAutoCheck(true);
    expect(UpdateService.getAutoCheck()).toBe(true);
  });
});
