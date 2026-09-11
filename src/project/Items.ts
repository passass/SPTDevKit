
import { currentProjectTag, modTag, vanillaTag, type ProjectArgs } from "../consts/ProjectConsts";
import { Path } from "../utils/pathUtils";
import { dataStore, useDataStore, type dataMapRecordType } from "@/stores/dataStore";
import { itemsSchema } from "@/types/schemas/items";
import Locales from "./Locales";
import { lootSpawns, lootSpawndataStore } from "./LootSpawns";

export const itemsDataStore = new dataStore("items");

class Items {
    async loadFromMod(projectArgs: ProjectArgs) {
	    const filesFound = await new Path(projectArgs.folderPath, "db/CustomItems/*.json").findFiles();
	    for (const filepath of filesFound) {
	        itemsDataStore.addFileToStore({
	            filename: filepath.filePath,
	            tags: projectArgs.tags,
	        });
	    }
	    if (!projectArgs.notLoadImmediately) await itemsDataStore.load();
	}

	clearProject() {
		const lootSpawnStore = lootSpawns;
		const itemsMap = itemsDataStore.getMap()
		const lootSpawnMap = lootSpawndataStore.getMap()
		for (const itemId of itemsDataStore.getByTagInStore(currentProjectTag).keys()) {
			itemsMap.delete(itemId);

			for (const spawnPoint of lootSpawnStore.getSpawnPointsForItem(itemId)) {
				const id = spawnPoint.get("locationId");
				if (typeof id === "string") lootSpawnMap.delete(id);
			}
		}

		const config = itemsDataStore.config;
		if (config) {
			if (!Array.isArray(config.file)) {
	            config.file = [config.file];
	        }

	        config.file = config.file.filter(
	            (file) => !file.tags?.includes(currentProjectTag)
	        );
		}
	}

	async saveLocales(currentProjectFolder: Path) {
		for (const [locale, localeMap] of Locales.getAllLocalesFor("items").entries()) {
			await new Path(currentProjectFolder, `db/CustomLocales/${locale}.json`).saveFile(localeMap);
		}
	}

	async saveProject(currentProjectFolder: Path) {
		const res = new Map<string, dataMapRecordType>();
        for (const [itemId, item] of itemsDataStore.getByTagInStore(currentProjectTag).entries()) {
            res.set(itemId, item.data);
		}

		const lootSpawnsResult: Map<string, Array<dataMapRecordType>> = new Map();
		for (const [itemId, item] of res.entries()) {
			for (const lootSpawn of lootSpawns.getSpawnPointsForItem(itemId)) {
				const location = lootSpawn.get("__location");
				if (typeof location !== "string") continue;
				const locationMap = lootSpawnsResult.get(location) ?? [];
				locationMap.push(lootSpawn);
				lootSpawnsResult.set(location, locationMap);
			}
		}

		await Promise.all([
			new Path(currentProjectFolder, `db/CustomLootspawns/CustomSpawnpointsForced/spawns.json`).saveFile(lootSpawnsResult),
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
					, tags: [vanillaTag]
				}
			],
			schemaType: itemsSchema
		});
	}
}

export default new Items();
