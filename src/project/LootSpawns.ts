import { defineStore } from "pinia";
import { LootLocationSchema } from "@/types/schemas/lootLocation";
import { Path } from "@/utils/pathUtils";
import { dataStore, useDataStore } from "@/stores/dataStore";
import { useFileDataStore } from "@/stores/fileStore";
import { getValuesByPath, isElectron } from "@/utils/utils";
import { currentProjectTag, type ProjectArgs } from "../consts/ProjectConsts";
import type { SchemaData } from "@/types/fields/fields";
import { generateUUID24chars } from "@/utils/uuidUtils";
import { copyRecordSchema } from "@/utils/copyUtils";

const SPAWN_POINTS_STORE = "spawnPoints";
export const lootSpawndataStore = new dataStore(SPAWN_POINTS_STORE);

class LootSpawns {
    ensureStore() {
        if (!lootSpawndataStore.isInited()) {
            lootSpawndataStore.register({ file: [], schemaType: LootLocationSchema, manualClear: true });
        }
    }

	init() {
		this.ensureStore();
	}

    addSpawnPoint(newVal: SchemaData) {
        if (typeof newVal !== "object" || !("__location" in newVal) || typeof newVal["__location"] !== "string")
            return;
        const id = (newVal["locationId"] as string) ?? generateUUID24chars();
        newVal["locationId"] = id;
        lootSpawndataStore.addSchema(newVal, id);
        lootSpawndataStore.addTag(id, currentProjectTag);
    }

    removeSpawnPoint(val: any) {
        const id = val["locationId"];
        if (typeof id === "string") {
            lootSpawndataStore.remove(id);
        }
    }

    async loadFromMod(projectArgs: ProjectArgs) {
        if (!isElectron()) return;
        const fileStore = useFileDataStore();
        const path = new Path(projectArgs.folderPath, `db/CustomLootspawns/CustomSpawnpointsForced/*.json`);
        const files = await path.findFiles();
        for (const file of files) {
            const content = await fileStore.read(file.toString());
            for (const [_location, spawnPoints] of Object.entries(content.data)) {
				if (!Array.isArray(spawnPoints) || _location === "sandbox_high") continue;
				let location = _location;
				if (_location === "factory4_day" || _location === "factory4_day") {
					location = "factory"
				}
                for (const spawnPoint of spawnPoints) {
                    spawnPoint["__location"] = location;
                    const id = (spawnPoint["locationId"] as string) ?? generateUUID24chars();
                    spawnPoint["locationId"] = id;
                    lootSpawndataStore.addSchema(spawnPoint, id);
                    for (const tag of (projectArgs.tags ?? [])) {
                        lootSpawndataStore.addTag(id, tag);
					}
				}
            }
        }
    }

    async loadFromEFT(EFTFolder: Path) {
        if (!isElectron()) return;
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
                lootSpawndataStore.addSchema(spawnPoint, id);
                lootSpawndataStore.addTag(id, "vanilla");
            }
        }
	}

	copy(schema: LootLocationSchema): LootLocationSchema {
		const res = copyRecordSchema(schema);
        const template: any = res.get("template");
        if (template && typeof template === "object") {
            template["Root"] = res.getValueByPath("template.Items.0._id");
        }

        return res;
	}

	getSpawnPointsForItem(itemId: string | number): LootLocationSchema[] {
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
    }
}

export const lootSpawns = new LootSpawns();
