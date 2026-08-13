// src/background.cjs
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')

let mainWindow = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js') // Важно: подключаем preload
    }
  })

  // Загружаем приложение
  if (process.env.WEBPACK_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist-electron/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Обработка сообщений от рендерера
  ipcMain.on('toMain', (event, data) => {
    console.log('Received from renderer:', data)
    
    // Отправляем ответ обратно в рендерер
    event.reply('fromMain', 'Hello from main process!')
    
    // Или используем mainWindow для отправки
    if (mainWindow) {
      mainWindow.webContents.send('fromMain', 'Response from main!')
    }
  })
}

// Жизненный цикл приложения
app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

// Дополнительные IPC обработчики
ipcMain.handle('get-app-version', () => {
  return app.getVersion()
})

ipcMain.handle('get-app-path', () => {
  return app.getPath('userData')
})