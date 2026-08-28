// src/preload.js
const path = require("path");
const { app, contextBridge, ipcRenderer } = require("electron");

// const ROOT_DIR = app.getAppPath()
// const DATA_DIR = path.join(app.getAppPath(), 'data');

// Экспонируем безопасные API для рендерера
contextBridge.exposeInMainWorld("electronAPI", {
	getDataDir: () => ipcRenderer.invoke('data-dir'),
	// getRootDir: () => ROOT_DIR,

	selectFolder: () => ipcRenderer.invoke('select-folder'),

	findFilesSync: (pattern, options) => ipcRenderer.invoke('find-files-sync', pattern, options),
	findFolders: (pattern, options) => ipcRenderer.invoke('find-folders', pattern, options),
	findFiles: (pattern, options) => ipcRenderer.invoke('find-files', pattern, options),
    fileExists: (filePath) => ipcRenderer.invoke('file-exists', filePath),

	readJson: (filePath) => ipcRenderer.invoke("read-json", filePath),
	readLocalJson: (filename) => ipcRenderer.invoke("read-local-json", filename),
	writeJson: (filePath, data) => ipcRenderer.invoke("write-json", { filePath, data }),
	writeLocalJson: (filename, data) => ipcRenderer.invoke("write-local-json", { filename, data }),
	send: (channel, data) => {
		// Белый список каналов
		const validChannels = ["toMain"];
		if (validChannels.includes(channel)) {
			ipcRenderer.send(channel, data);
		}
	},
	receive: (channel, func) => {
		const validChannels = ["fromMain"];
		if (validChannels.includes(channel)) {
			ipcRenderer.on(channel, (event, ...args) => func(...args));
		}
	},

	pathUtils: {
        isAbsolute: (filePath) => path.isAbsolute(filePath),
        join: (...args) => path.join(...args),
        basename: (filePath) => path.basename(filePath),
        dirname: (filePath) => path.dirname(filePath),
        relative: (filePath1, filePath2) => path.relative(filePath1, filePath2),
    }
});
