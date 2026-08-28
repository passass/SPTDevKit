import { useDataStore, type DataStoreConfigFiles } from "@/stores/dataStore";
import type { RecordSchema } from "@/types/fields/fields";
import type { ClassType } from "@/utils/classUtils";
import { generateSchemaInFile } from "@/utils/schemaGenerator";
import { isElectron } from "@/utils/utils";

class Traders {
	dataStore: ReturnType<typeof useDataStore> | null = null

	async loadAdditionalTrader(filepath: string, tags: DataStoreConfigFiles["tags"]=[]) {
		this.dataStore?.addFileToStore("traders", {
			filename: filepath,
			tags: ["oneObject", ...tags]
		})
	}

	async load() {
		if (!isElectron()) {
			console.error("not implemented traders")
			return;
		}

		this.dataStore = useDataStore();

		const basetraderschema = await generateSchemaInFile("basetraderschema.json");
		
		const files = []
		for (const filepath of await window.electronAPI.findFiles(
			await window.electronAPI.pathUtils.join(
				await window.electronAPI.getDataDir(),
				"traders/*/base.json",
			)
		)) {
			files.push({
				filename: filepath,
				tags: ["vanilla", "oneObject"]
			})
		}

		this.dataStore.register("traders", {
			file: files,
			schemaType: basetraderschema as ClassType<RecordSchema>
		})
	}
	
	constructor() {

	}
}

export default new Traders();