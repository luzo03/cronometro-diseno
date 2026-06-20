import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    close: () => ipcRenderer.invoke('window:close'),
    setAlwaysOnTop: (flag: boolean) => ipcRenderer.invoke('window:setAlwaysOnTop', flag),
    getAlwaysOnTop: () => ipcRenderer.invoke('window:getAlwaysOnTop'),
    setSize: (width: number, height: number) =>
      ipcRenderer.invoke('window:setSize', width, height)
  },
  updater: {
    checkForUpdates: () => ipcRenderer.invoke('updater:checkForUpdates'),
    installUpdate: () => ipcRenderer.invoke('updater:installUpdate'),
    onChecking: (cb: () => void) => {
      ipcRenderer.on('updater:checking', cb)
      return () => ipcRenderer.removeListener('updater:checking', cb)
    },
    onAvailable: (cb: (info: unknown) => void) => {
      const handler = (_e: unknown, info: unknown): void => cb(info)
      ipcRenderer.on('updater:available', handler)
      return () => ipcRenderer.removeListener('updater:available', handler)
    },
    onNotAvailable: (cb: () => void) => {
      ipcRenderer.on('updater:not-available', cb)
      return () => ipcRenderer.removeListener('updater:not-available', cb)
    },
    onProgress: (cb: (p: { percent: number }) => void) => {
      const handler = (_e: unknown, p: { percent: number }): void => cb(p)
      ipcRenderer.on('updater:progress', handler)
      return () => ipcRenderer.removeListener('updater:progress', handler)
    },
    onDownloaded: (cb: (info: unknown) => void) => {
      const handler = (_e: unknown, info: unknown): void => cb(info)
      ipcRenderer.on('updater:downloaded', handler)
      return () => ipcRenderer.removeListener('updater:downloaded', handler)
    },
    onError: (cb: (msg: string) => void) => {
      const handler = (_e: unknown, msg: string): void => cb(msg)
      ipcRenderer.on('updater:error', handler)
      return () => ipcRenderer.removeListener('updater:error', handler)
    }
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  ;(window as unknown as { electron: typeof electronAPI }).electron = electronAPI
  ;(window as unknown as { api: typeof api }).api = api
}

export type Api = typeof api
