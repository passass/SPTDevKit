import { currentProjectTag, modTag, vanillaTag, type ProjectArgs } from "../consts/ProjectConsts";
import { Path } from "../utils/pathUtils";
import { dataStore, useDataStore, type dataMapRecordType } from "@/stores/dataStore";
import { itemsSchema } from "@/types/schemas/items";
import Locales from "./Locales";
import { lootSpawns, lootSpawndataStore } from "./LootSpawns";
import { customRef } from "vue";
import { RecordSchema } from "@/types/fields/fields";
import { deepClone, getValueByPath } from "@/utils/utils";
import { copyRecordSchema } from "@/utils/copyUtils";

export const itemsDataStore = new dataStore("items");

class Items {
    async loadFromMod(projectArgs: ProjectArgs) {
        const filesFound = await new Path(projectArgs.folderPath, "db/CustomItems/**/*.json").findFiles();
        for (const filepath of filesFound) {
            itemsDataStore.addFileToStore({
                filename: filepath.filePath,
                tags: projectArgs.tags ?? [],
            });
        }
        if (!projectArgs.notLoadImmediately) await itemsDataStore.load();
    }

    clearProject() {
        const lootSpawnStore = lootSpawns;
        const lootSpawnMap = lootSpawndataStore.getMap();
        for (const itemId of itemsDataStore.getByTagInStore(currentProjectTag).keys()) {
            for (const spawnPoint of lootSpawnStore.getSpawnPointsForItem(itemId)) {
                const id = spawnPoint.get("locationId");
                if (typeof id === "string") lootSpawnMap.delete(id);
            }
        }

        itemsDataStore.clearStoreFromObjectWithTags(currentProjectTag);
    }

    async saveLocales(currentProjectFolder: Path) {
        for (const [locale, localeMap] of Locales.getAllLocalesFor("items").entries()) {
            await new Path(currentProjectFolder, `db/CustomLocales/${locale}.json`).saveFile(localeMap);
        }
    }

    async saveProject(projectArgs: ProjectArgs) {
        await Promise.all([
            window.electronAPI.removeFolder(new Path(projectArgs.folderPath, "db/CustomLocales").toString()),
            window.electronAPI.removeFolder(new Path(projectArgs.folderPath, "db/CustomLootspawns").toString()),
            window.electronAPI.removeFolder(new Path(projectArgs.folderPath, "db/CustomItems").toString()),
        ]);

        const res = new Map<string | number, dataMapRecordType>();
        for (const [itemId, item] of itemsDataStore.getByTagInStore(currentProjectTag).entries()) {
            res.set(itemId, item.data);
        }

        const lootSpawnsResult: Map<string | number, Array<RecordSchema>> = new Map();
        for (const [itemId, item] of res.entries()) {
            for (const lootSpawn of lootSpawns.getSpawnPointsForItem(itemId)) {
                let location = lootSpawn.get("__location");
                if (typeof location !== "string") continue;
                if (location === "factory") {
                    location = "factory4_day";
                }
                const locationMap = lootSpawnsResult.get(location) ?? [];
                locationMap.push(lootSpawn);
                lootSpawnsResult.set(location, locationMap);
            }
        }

        if (lootSpawnsResult.has("sandbox")) {
            const sandboxHighSpawns = lootSpawnsResult.get("sandbox")!.map((spawn) => lootSpawns.copy(spawn));
            lootSpawnsResult.set("sandbox_high", sandboxHighSpawns);
        }

        if (lootSpawnsResult.has("factory4_day")) {
        	const factoryDaySpawns = lootSpawnsResult.get("factory4_day")!.map((spawn) => lootSpawns.copy(spawn));
            lootSpawnsResult.set("factory4_night", factoryDaySpawns);
        }

        await Promise.all([
            new Path(projectArgs.folderPath, `db/CustomLootspawns/CustomSpawnpointsForced/spawns.json`).saveFile(
                lootSpawnsResult
            ),
            this.saveLocales(projectArgs.folderPath),
            new Path(projectArgs.folderPath, `db/CustomItems/items.json`).saveFile(res),
        ]);
    }

    init() {
        const dataStore = useDataStore();
        dataStore.register("items", {
            file: [
                {
                    filename: "items.json",
                    tags: [vanillaTag],
                },
            ],
            schemaType: itemsSchema,
        });
    }

    getFieldResult(itemId: string | number, path: string): any {
        const item = itemsDataStore.get(itemId);
        let data;
        if (item instanceof RecordSchema) data = item.getData();
        else data = item;
        const result = getValueByPath(data, path);
        if (!result) {
            const parent = data["itemTplToClone"] ?? data["parentId"];
            if (parent) return this.getFieldResult(parent, path);
            return undefined;
        }
        return result;
    }
}

export default new Items();
