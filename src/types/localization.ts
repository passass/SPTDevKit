import { FileConfig, useFileDataStore } from "@/stores/fileStore.ts";



export class GameLocalization {
	locales: Map<string, FileConfig<Record<string, string>>> = new Map()
	fileStore: ReturnType<typeof useFileDataStore> | null = null

	loadLocales() {
		
		this.fileStore = useFileDataStore()

		const filenames: string[] = ["ru_localization.json"];

		for (const filename of filenames) {
			this.locales.set(filename, this.fileStore.getOrCreate(filename))

			this.fileStore.read<Record<string, string>>(filename)
		}

	}

	getText(localeId: string): string | null {
		if (this.fileStore === null)
			return null;

		const {loaded, data} = this.fileStore.getDataIfLoaded("ru_localization.json")
		if (loaded) {
			return data[localeId] ?? null
		}
		return null
	}
}

export const gameLocalization = new GameLocalization()