// src/utils/Path.ts

import { time } from "console";
import { isElectron } from "./utils";

// src/utils/pathUtils.ts

export class PathArray {
    filePaths: Array<Path> = []
	base?: Path

    constructor(filePaths: Array<string | Path>, base?: Path | string) {
        this.filePaths = filePaths.map((el) => el instanceof Path ? el : new Path(el))
		this.base = typeof base === "string" ? new Path(base) : base
	}

    async forEach(
        func: (filePath: Path) => Promise<void> | void
    ): Promise<void> {
        let paths = this.filePaths

        for (const filePath of paths) {
			if (
				filePath.toString().includes("*")
				|| filePath.toString().includes("?")
			) {
				for (const _filePath of await filePath.findFiles()) {
					const newFilePath = this.base ? new Path(this.base, _filePath) : _filePath
					if (await newFilePath.exists()) {
						await func(newFilePath)
					}
				}
				continue
			}

			const newFilePath = this.base ? new Path(this.base, filePath) : filePath
            if (await newFilePath.exists()) {
                await func(newFilePath)
            }
        }
    }
}

export class Path {
	readonly filePath: string = "";

	constructor(...parts: Array<string | Path>) {
		if (!isElectron()) throw new Error("not implemented Path in browser");
		this.filePath = window.electronAPI.pathUtils.join(
			...parts.map((el: any) => (el instanceof Path ? el.filePath : el)),
		);
	}

	async findFiles(...parts: Array<string | Path>): Promise<Path[]> {
		return (
			await window.electronAPI.findFiles(
				this.join(...parts).toString(),
			)
		).map((el) => new Path(el));
	}

	async findFolders(...parts: Array<string | Path>): Promise<Path[]> {
		return (
			await window.electronAPI.findFolders(
				this.join(...parts).toString(),
			)
		).map((el) => new Path(el));
	}

	async exists(): Promise<boolean> {
		return window.electronAPI.fileExists(this.filePath);
	}

	// Добавить часть пути
	join(...parts: Array<string | Path>): Path {
		return new Path(
			this.filePath,
			...parts.map((el: any) => (el instanceof Path ? el.filePath : el)),
		);
	}

	stem(): string {
		const basename = this.basename();
		const lastDot = basename.lastIndexOf(".");
		return lastDot > 0 ? basename.slice(0, lastDot) : basename;
	}

	// Получить строку с / (Unix-style)
	toString(): string {
		return this.filePath;
	}

	// Получить последнюю часть пути
	basename(): string {
		return window.electronAPI.pathUtils.basename(this.filePath);
	}

	// Получить путь без последней части (директория)
	dirname(): Path {
		return new Path(window.electronAPI.pathUtils.dirname(this.filePath));
	}

	// Получить расширение файла
	extname(): string {
		const basename = this.basename();
		const lastDot = basename.lastIndexOf(".");
		return lastDot > 0 ? basename.slice(lastDot) : "";
	}

	// Получить имя файла без расширения
	name(): string {
		return this.basename();
	}

	// Проверить, является ли абсолютным
	isAbsolute(): boolean {
		return window.electronAPI.pathUtils.isAbsolute(this.filePath);
	}

	relative(filePath: string | Path): Path {
		if (filePath instanceof Path)
			return new Path(
				window.electronAPI.pathUtils.relative(
					this.filePath,
					filePath.filePath,
				),
			);
		return new Path(
			window.electronAPI.pathUtils.relative(this.filePath, filePath),
		);
	}
}
