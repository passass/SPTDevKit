import { defineStore } from "pinia";
import { LootLocationSchema } from "@/types/schemas/lootLocation";
import { Path } from "@/utils/pathUtils";
import { dataStore, useDataStore } from "@/stores/dataStore";
import { useFileDataStore } from "@/stores/fileStore";
import { getValuesByPath, isElectron } from "@/utils/utils";
import { currentProjectTag, type ProjectArgs } from "./ProjectConsts";
import type { SchemaData } from "@/types/fields/fields";
import { generateUUID24chars } from "@/utils/uuidUtils";

const SPAWN_POINTS_STORE = "spawnPoints";
export const lootSpawndataStore = new dataStore(SPAWN_POINTS_STORE);

export const useLootSpawns = defineStore("lootSpawns", {
    actions: {
        ensureStore() {
            if (!lootSpawndataStore.isInited()) {
                lootSpawndataStore.register({ file: [], schemaType: LootLocationSchema, manualClear: true });
            }
        },

        addSpawnPoint(newVal: SchemaData) {
            if (typeof newVal !== "object" || !("__location" in newVal) || typeof newVal["__location"] !== "string")
                return;
            this.ensureStore();
            const id = (newVal["locationId"] as string) ?? generateUUID24chars();
            newVal["locationId"] = id;
            lootSpawndataStore.addSchema(id, newVal);
            lootSpawndataStore.addTag(id, currentProjectTag);
        },

        removeSpawnPoint(val: any) {
            this.ensureStore();
            const id = val["locationId"];
            if (typeof id === "string") {
                lootSpawndataStore.remove(id);
            }
        },

        async loadLocations(projectArgs: ProjectArgs) {
            if (!isElectron()) return;
            this.ensureStore();
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
                        lootSpawndataStore.addSchema(id, spawnPoint);
                        for (const tag of projectArgs.tags) {
                            lootSpawndataStore.addTag(id, tag);
						}
					}
                }
            }
        },

        async loadFromEFT(EFTFolder: Path) {
            if (!isElectron()) return;
            this.ensureStore();
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
                    lootSpawndataStore.addSchema(id, spawnPoint);
                    lootSpawndataStore.addTag(id, "vanilla");
                }
            }
        },

        getSpawnPointsForItem(itemId: string): LootLocationSchema[] {
        	this.ensureStore();
            const res: LootLocationSchema[] = [];
            for (const [, record] of lootSpawndataStore.getMap().entries()) {
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
