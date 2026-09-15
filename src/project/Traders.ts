import { useDataStore, type DataStoreConfigFiles } from "@/stores/dataStore";
import type { RecordSchema } from "@/types/fields/fields";
import { generateSchemaInFile } from "@/utils/schemaGenerator";
import { isElectron } from "@/utils/utils";
import { Path, PathArray } from "@/utils/pathUtils";
import { type ProjectArgs } from "../consts/ProjectConsts";

class Traders {
	dataStore: ReturnType<typeof useDataStore> | null = null

	async loadAdditionalTrader(filepath: string, tags: DataStoreConfigFiles["tags"]=[]) {
		this.dataStore?.addFileToStore("traders", {
			filename: filepath,
			tags: ["oneObject", ...tags]
		})
	}

	async loadFromMod(projectArgs: ProjectArgs) {
        await new PathArray(["data/base.json", "db/base.json"], projectArgs.folderPath).forEach((filePath) => {
            this.loadAdditionalTrader(filePath.toString(), projectArgs.tags);
        });
        if (!projectArgs.notLoadImmediately) await this.dataStore?.load("traders");
    }

	async asyncInit() {
		this.dataStore = useDataStore();
		if (!isElectron()) {
			this.dataStore.register("traders", {
				file: [],
			})
			console.error("not implemented traders")
			return;
		}

		const basetraderschema = await generateSchemaInFile("basetraderschema.json");

		const files = []
		for (const filepath of await new Path(
			await window.electronAPI.getDataDir(),
			"traders/*/base.json",
		).findFiles()) {
			files.push({
				filename: filepath.toString(),
				tags: ["vanilla", "oneObject"]
			})
		}

		this.dataStore.register("traders", {
			file: files,
			schemaType: basetraderschema as typeof RecordSchema
		})
	}

	constructor() {

	}
}

export default new Traders();
