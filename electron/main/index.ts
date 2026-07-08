import { app, BrowserWindow, ipcMain, shell, dialog, Notification } from 'electron'
import { join } from 'path'
import { writeFile } from 'fs/promises'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { autoUpdater } from 'electron-updater'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 440,
    minWidth: 340,
    minHeight: 220,
    maxWidth: 520,
    show: false,
    frame: false,
    transparent: false,
    resizable: true,
    alwaysOnTop: true,
    skipTaskbar: false,
    backgroundColor: '#0A0A0B',
    title: 'DesignTimer',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function setupWindowControls(): void {
  ipcMain.handle('window:minimize', () => mainWindow?.minimize())
  ipcMain.handle('window:close', () => mainWindow?.close())
  ipcMain.handle('window:setAlwaysOnTop', (_e, flag: boolean) => {
    mainWindow?.setAlwaysOnTop(flag)
  })
  ipcMain.handle('window:setSize', (_e, width: number, height: number) => {
    if (!mainWindow) return
    const [x, y] = mainWindow.getPosition()
    mainWindow.setBounds({ x, y, width, height }, true)
  })
  ipcMain.handle('window:getAlwaysOnTop', () => mainWindow?.isAlwaysOnTop() ?? true)
  ipcMain.handle('window:setZoomFactor', (_e, factor: number) => {
    if (!mainWindow) return
    const clamped = Math.max(0.7, Math.min(1.6, factor))
    mainWindow.webContents.setZoomFactor(clamped)
  })
}

function setupFileHandlers(): void {
  ipcMain.handle(
    'file:saveCSV',
    async (
      _e,
      payload: { content: string; suggestedName: string }
    ): Promise<{ ok: boolean; path?: string; canceled?: boolean; error?: string }> => {
      if (!mainWindow) return { ok: false, error: 'no window' }
      try {
        const result = await dialog.showSaveDialog(mainWindow, {
          title: 'Guardar reporte',
          defaultPath: payload.suggestedName,
          filters: [{ name: 'CSV', extensions: ['csv'] }]
        })
        if (result.canceled || !result.filePath) {
          return { ok: false, canceled: true }
        }
        await writeFile(result.filePath, payload.content, 'utf8')
        return { ok: true, path: result.filePath }
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : String(err) }
      }
    }
  )

  ipcMain.handle('file:revealInFolder', (_e, filePath: string) => {
    shell.showItemInFolder(filePath)
  })
}

function setupNotifications(): void {
  ipcMain.handle(
    'notify',
    (_e, payload: { title: string; body: string }): boolean => {
      if (!Notification.isSupported()) return false
      const n = new Notification({
        title: payload.title,
        body: payload.body,
        silent: false
      })
      n.on('click', () => {
        if (mainWindow) {
          if (mainWindow.isMinimized()) mainWindow.restore()
          mainWindow.focus()
        }
      })
      n.show()
      return true
    }
  )
}

function setupUpdater(): void {
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('checking-for-update', () => {
    mainWindow?.webContents.send('updater:checking')
  })
  autoUpdater.on('update-available', (info) => {
    mainWindow?.webContents.send('updater:available', info)
  })
  autoUpdater.on('update-not-available', () => {
    mainWindow?.webContents.send('updater:not-available')
  })
  autoUpdater.on('download-progress', (progress) => {
    mainWindow?.webContents.send('updater:progress', progress)
  })
  autoUpdater.on('update-downloaded', (info) => {
    mainWindow?.webContents.send('updater:downloaded', info)
  })
  autoUpdater.on('error', (err) => {
    mainWindow?.webContents.send('updater:error', err.message)
  })

  ipcMain.handle('updater:checkForUpdates', () => autoUpdater.checkForUpdates())
  ipcMain.handle('updater:installUpdate', () => autoUpdater.quitAndInstall())
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.luzo03.designtimer')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  setupWindowControls()
  setupFileHandlers()
  setupNotifications()
  createWindow()

  if (!is.dev) {
    setupUpdater()
    setTimeout(() => {
      autoUpdater.checkForUpdatesAndNotify().catch(() => {
        // silent
      })
    }, 3000)
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
