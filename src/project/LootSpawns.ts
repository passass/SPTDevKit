import { defineStore } from "pinia";
import { LootLocationSchema } from "@/types/schemas/lootLocation";
import { Path } from "@/utils/pathUtils";
import { useDataStore } from "@/stores/dataStore";
import { useFileDataStore } from "@/stores/fileStore";
import { getValuesByPath, isElectron } from "@/utils/utils";
import { currentProjectTag, type ProjectArgs } from "./ProjectConsts";
import type { SchemaData } from "@/types/fields/fields";
import { generateUUID24chars } from "@/utils/uuidUtils";

const SPAWN_POINTS_STORE = "spawnPoints";

export const useLootSpawns = defineStore("lootSpawns", {
    actions: {
        ensureStore() {
            const dataStore = useDataStore();
            if (!dataStore.getKeys().includes(SPAWN_POINTS_STORE)) {
                dataStore.register(SPAWN_POINTS_STORE, { file: [], schemaType: LootLocationSchema, manualClear: true });
            }
        },

        addSpawnPoint(newVal: SchemaData) {
            if (typeof newVal !== "object" || !("__location" in newVal) || typeof newVal["__location"] !== "string")
                return;
            this.ensureStore();
            const dataStore = useDataStore();
            const id = (newVal["locationId"] as string) ?? generateUUID24chars();
            newVal["locationId"] = id;
            dataStore.addSchema(SPAWN_POINTS_STORE, id, newVal);
            dataStore.addTag(SPAWN_POINTS_STORE, id, currentProjectTag);
        },

        removeSpawnPoint(val: any) {
            this.ensureStore();
            const dataStore = useDataStore();
            const id = val["locationId"];
            if (typeof id === "string") {
                dataStore.remove(SPAWN_POINTS_STORE, id);
            }
        },

        async loadLocations(projectArgs: ProjectArgs) {
            if (!isElectron()) return;
            this.ensureStore();
            const dataStore = useDataStore();
            const fileStore = useFileDataStore();
            const path = new Path(projectArgs.folderPath, `db/CustomLootspawns/CustomSpawnpointsForced/*.json`);
            const files = await path.findFiles();
            for (const file of files) {
                const content = await fileStore.read(file.toString());
                for (const [location, spawnPoints] of Object.entries(content.data)) {
                    if (!Array.isArray(spawnPoints)) continue;
                    for (const spawnPoint of spawnPoints) {
                        spawnPoint["__location"] = location;
                        const id = (spawnPoint["locationId"] as string) ?? generateUUID24chars();
                        spawnPoint["locationId"] = id;
                        dataStore.set(SPAWN_POINTS_STORE, id, spawnPoint);
                        for (const tag of projectArgs.tags) {
                            dataStore.addTag(SPAWN_POINTS_STORE, id, tag);
                        }
                    }
                }
            }
        },

        async loadFromEFT(EFTFolder: Path) {
            if (!isElectron()) return;
            this.ensureStore();
            const dataStore = useDataStore();
            const fileStore = useFileDataStore();
            for (const filePath of await new Path(
                EFTFolder,
                "SPT*/SPT_Data/database/locations/*/looseLoot.json"
            ).findFiles()) {
                const location = filePath.dirname().basename().toLowerCase();
                const content = await fileStore.read(filePath.toString());
                for (const spawnPoint of content.data["spawnpointsForced"]) {
                    spawnPoint["__location"] = location;
                    const id = (spawnPoint["locationId"] as string) ?? generateUUID24chars();
                    spawnPoint["locationId"] = id;
                    dataStore.addSchema(SPAWN_POINTS_STORE, id, spawnPoint);
                    dataStore.addTag(SPAWN_POINTS_STORE, id, "vanilla");
                }
            }
        },

        getSpawnPointsForItem(itemId: string): LootLocationSchema[] {
            this.ensureStore();
            const dataStore = useDataStore();
            const res: LootLocationSchema[] = [];
            for (const [, record] of dataStore.getMap(SPAWN_POINTS_STORE).entries()) {
                if (
                    record.data instanceof LootLocationSchema &&
                    getValuesByPath(record.data.getData(), "template.Items.*._tpl").includes(itemId)
                ) {
                    res.push(record.data);
                }
            }
            return res;
        },
    },
});
