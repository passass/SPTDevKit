// src/background.cjs
const { app, BrowserWindow, ipcMain, dialog, Menu  } = require("electron");
const path = require("path");
const { fileURLToPath } = require("url");
const fs = require("fs").promises;


// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

const ROOT_DIR = app.getAppPath()
const DATA_DIR = path.join(app.getAppPath(), 'data');
// process.env.NODE_ENV === 'development'
// ? path.join(__dirname, '../..')
// : path.join(__dirname, '../');


let mainWindow = null;

function createWindow() {
	const isDev = !app.isPackaged;
	const exePath = isDev ? process.execPath : app.getPath('exe');
	const preloadPath = path.join(ROOT_DIR, 'src', 'preload.js');

	mainWindow = new BrowserWindow({
        width: 1200,
		height: 800,

        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false,
            preload: preloadPath, //path.join(__dirname, "preload.js"),
        },
    })

	// Menu.setApplicationMenu(null)
	if (process.env.WEBPACK_DEV_SERVER_URL) {
		mainWindow.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
		mainWindow.webContents.openDevTools();
	} else {
		mainWindow.loadFile(
			path.join(__dirname, "../dist-electron/index.html"),
		);
	}

	mainWindow.on("closed", () => {
		mainWindow = null;
	});

	if (process.env.NODE_ENV === "development") {
		mainWindow.webContents.openDevTools();
	}

	// Обработка сообщений от рендерера
	ipcMain.on("toMain", (event, data) => {
		console.log("Received from renderer:", data);

		// Отправляем ответ обратно в рендерер
		event.reply("fromMain", "Hello from main process!");

		// Или используем mainWindow для отправки
		if (mainWindow) {
			mainWindow.webContents.send("fromMain", "Response from main!");
		}
	});
}

// Жизненный цикл приложения
app.on("ready", createWindow);

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
	}
});

app.on("activate", () => {
	if (mainWindow === null) {
		createWindow();
	}
});

// Дополнительные IPC обработчики
ipcMain.handle("get-app-version", () => {
	return app.getVersion();
});

ipcMain.handle("get-app-path", () => {
	return app.getPath("userData");
});

const jsonc = require('jsonc-parser')

ipcMain.handle("read-file", async (event, filePath) => {
	// for (const jsonModule of [JSON, jsonc]) {
	try {
		const buffer = await fs.readFile(filePath, 'utf-8');
		return {
			success: true,
			data: Buffer.from(buffer),
			path: filePath
		};
	} catch (error) {

	}

	return {
		success: false,
		error: `Failed to load file ${filePath}`,
		path: filePath
	};
});

ipcMain.handle('delete-folder', async (event, folderPath) => {
    try {
        await fs.rm(folderPath, { recursive: true, force: true });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('read-json', async (event, filePath) => {
	let fileContent
	try {
		fileContent = await fs.readFile(filePath, 'utf-8');
	} catch (error) { 	}
	// for (const jsonModule of [JSON, jsonc]) {
	try {
		const converted = await jsonc.parse(fileContent)
		return {
			success: true,
			data: converted,
			path: filePath
		};
	} catch (error) {

	}
	// }

	return {
		success: false,
		error: `Failed to parse JSON ${filePath}`,
		path: filePath
	};
});

ipcMain.handle('read-local-json', async (event, filename) => {
    try {
        const safeFilename = path.basename(filename);
        const filePath = path.join(DATA_DIR, safeFilename);

        const fileContent = await fs.readFile(filePath, 'utf-8');
        return {
            success: true,
            data: jsonc.parse(fileContent),
            path: filePath
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
            path: filename
        };
    }
});

ipcMain.handle('write-json', async (event, { filePath, data }) => {
    try {
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, typeof data === "string" ? data : JSON.stringify(data, null, 2), 'utf-8');
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('write-local-json', async (event, { filename, data }) => {
    try {
        const safeFilename = path.basename(filename);
        const filePath = path.join(DATA_DIR, safeFilename);

        // Создаем директорию, если её нет
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, typeof data === "string" ? data : JSON.stringify(data, null, 2), 'utf-8');

        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});


ipcMain.handle('data-dir', () => {
	return DATA_DIR
})

ipcMain.handle('select-file', async (event, selectArgs) => {
	const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        title: selectArgs.title,
        buttonLabel: selectArgs.buttonLabel,
        filters: selectArgs.filters,
    });

    if (result.canceled || result.filePaths.length === 0) {
        return { success: false, canceled: true };
    }

    const filePath = result.filePaths[0];

    try {
        return { success: true, path: filePath };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('copy-file', async (event, { sourcePath, destinationPath }) => {
    try {
        await fs.mkdir(path.dirname(destinationPath), { recursive: true });
        await fs.copyFile(sourcePath, destinationPath);
        return { success: true, path: destinationPath };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog({
        properties: ['openDirectory'],
        title: 'Выберите папку',
        buttonLabel: 'Выбрать',
    });

    if (result.canceled) {
        return null;
    }

    return result.filePaths[0];
});

const fg = require('fast-glob');

ipcMain.handle('file-exists', async (event, filePath) => {
    try {
        await fs.access(filePath); // , fs.constants.F_OK
        return true;
    } catch {
        return false;
    }
});

ipcMain.handle('find-files-sync', (event, pattern, options) => {
    try {
        // fast-glob строго требует прямые слеши '/' даже в Windows
        const normalizedPattern = pattern.replace(/\\/g, '/');

        const files = fg.sync(normalizedPattern, {
            absolute: true,
            onlyFiles: true,
            ignore: ['**/node_modules/**', '**/.git/**', '**/.*/**'],
            ...options
        });
        return files;
    } catch (error) {
        console.error('Error finding files:', error);
        throw error;
    }
});

ipcMain.handle('find-folders', async (event, pattern, options) => {
    try {
        // fast-glob строго требует прямые слеши '/' даже в Windows
        const normalizedPattern = pattern.replace(/\\/g, '/');

        const dirs = await fg(normalizedPattern, {
            absolute: true,
            onlyDirectories: true,
            ignore: ['**/node_modules/**', '**/.git/**', '**/.*/**'],
            ...options
        });
        return dirs;
    } catch (error) {
        console.error('Error finding folders:', error);
        throw error;
    }
});

ipcMain.handle('find-files', async (event, pattern, options) => {
    try {
        // fast-glob строго требует прямые слеши '/' даже в Windows
        const normalizedPattern = pattern.replace(/\\/g, '/');

        const files = await fg(normalizedPattern, {
            absolute: true,
            onlyFiles: true,
            ignore: ['**/node_modules/**', '**/.git/**', '**/.*/**'],
            ...options
        });
        return files;
    } catch (error) {
        console.error('Error finding files:', error);
        throw error;
    }
});

ipcMain.handle("get-versions", () => {
    return {
        node: process.versions.node,
        electron: process.versions.electron,
        chrome: process.versions.chrome,
        app: app.getVersion()
    };
});
