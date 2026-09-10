
import { currentProjectTag, modTag, type ProjectArgs } from "./ProjectConsts";
import { Path } from "../utils/pathUtils";
import { useDataStore, type dataMapRecordType } from "@/stores/dataStore";
import { itemsSchema } from "@/types/schemas/items";
import Locales from "./Locales";
import { useLootSpawns } from "./LootSpawns";

class Items {
    async loadItems(projectArgs: ProjectArgs) {
	   	const dataStore = useDataStore();
	    const filesFound = await new Path(projectArgs.folderPath, "db/CustomItems/*.json").findFiles();
	    for (const filepath of filesFound) {
	        dataStore.addFileToStore("items", {
	            filename: filepath.filePath,
	            tags: projectArgs.tags,
	        });
	    }
	    if (!projectArgs.notLoadImmediately) await dataStore.load("items");
	}

	async saveLocales(currentProjectFolder: Path) {
		for (const [locale, localeMap] of Locales.getAllLocalesFor("items").entries()) {
			await new Path(currentProjectFolder, `db/CustomLocales/${locale}.json`).saveFile(localeMap);
		}
	}

	async saveProject(currentProjectFolder: Path) {
		const dataStore = useDataStore();
		const res = new Map<string, dataMapRecordType>();
        for (const [itemId, item] of dataStore.getByTagInStore("items", currentProjectTag).entries()) {
            res.set(itemId, item.data);
		}

		const lootSpawnStore = useLootSpawns();
		const lootSpawns: Map<string, Array<dataMapRecordType>> = new Map();
		for (const [itemId, item] of res.entries()) {
			for (const lootSpawn of lootSpawnStore.getSpawnPointsForItem(itemId)) {
				const location = lootSpawn.get("__location");
				if (typeof location !== "string") continue;
				const locationMap = lootSpawns.get(location) ?? [];
				locationMap.push(lootSpawn);
				lootSpawns.set(location, locationMap);
			}
		}

		await Promise.all([
			new Path(currentProjectFolder, `db/CustomLootspawns/CustomSpawnpointsForced/spawns.json`).saveFile(lootSpawns),
			this.saveLocales(currentProjectFolder),
			new Path(currentProjectFolder, `db/CustomItems/items.json`).saveFile(res),
		]);
	}

	async load() {
		const dataStore = useDataStore();
		dataStore.register("items", {
			file: [
				{
					filename: 'items.json'
					, tags: ["vanilla"]
				}
			],
			schemaType: itemsSchema
		});
	}
}

export default new Items();
