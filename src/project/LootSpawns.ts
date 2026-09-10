import { defineStore } from "pinia";
import { LootLocationSchema } from "@/types/schemas/lootLocation";
import { Path } from "@/utils/pathUtils";
import { type dataMapRecordType } from "@/stores/dataStore";
import { useFileDataStore } from "@/stores/fileStore";
import { getValuesByPath, isElectron, toJsonObject } from "@/utils/utils";
import { currentProjectTag, modTag, type ProjectArgs } from "./ProjectConsts";

export const useLootSpawns = defineStore("lootSpawns", {
    state: () => ({
        // location -> spawnpoints
        SpawnPoints: new Map<string, Array<dataMapRecordType>>(),
    }),
    actions: {
        addTag(location: string, key: string, tag: string) {
            let data = this.SpawnPoints?.get(location)?.find((item) => item.data[key]);

            if (!data) {
                throw new Error("no data");
            }

            data.tags ??= [];
            if (!data.tags.includes(tag)) data.tags.push(tag);
		},
		createNew() {
			const newData: dataMapRecordType = {
				data: new LootLocationSchema({}, {
					fillWithDefault: true,
				}).toJSON(),
			};
			const arr = this.SpawnPoints.get(newData.data["__location"]) ?? [];
			arr.push(newData);
			this.SpawnPoints.set(newData.data["__location"], arr);
			return newData;
		},
		addSpawnPoint(location: string, newVal: any) {
			const arr = this.SpawnPoints.get(location) ?? [];
			arr.push({data: newVal, tags: []});
			this.SpawnPoints.set(location, arr);
		},
		removeSpawnPoint(val: any) {
			const location = val["__location"];
			const locationId = val["locationId"];
			const arr = this.SpawnPoints.get(location) ?? [];
			if (!arr) return;
			const index = arr.findIndex((el) => el.data === val);
			console.log(index, val)

			if (index !== -1) {
				arr.splice(index, 1);
			}
		},
        async loadLocations(projectArgs: ProjectArgs) {
            if (!isElectron()) return;
            // this.SpawnPoints.clear()
            const fileStore = useFileDataStore();
            const path = new Path(projectArgs.folderPath, `db/CustomLootspawns/CustomSpawnpointsForced/*.json`);
            const files = await path.findFiles();
            for (const file of files) {
                const content = await fileStore.read(file.toString());
                for (const [location, spawnPoints] of Object.entries(content.data)) {
                    if (!Array.isArray(spawnPoints)) continue;
                    const key = location.toLowerCase();
                    const spawnPointsSchemas: Array<dataMapRecordType> = this.SpawnPoints.get(key) ?? [];

                    for (const spawnPoint of spawnPoints) {
                        spawnPoint["__location"] = location;
                        spawnPointsSchemas.push({ data: spawnPoint, tags: projectArgs.tags });
                    }
                    this.SpawnPoints.set(key, spawnPointsSchemas);
                }
            }

            // fileStore.write("lootSpawns.json", JSON.stringify(toJsonObject(this.SpawnPoints), null, 2) );
        },
        async loadFromEFT(EFTFolder: Path) {
            if (!isElectron()) return;
            const fileStore = useFileDataStore();
            for (const filePath of await new Path(
                EFTFolder,
                "SPT*/SPT_Data/database/locations/*/looseLoot.json"
            ).findFiles()) {
                const location = filePath.dirname().basename().toLowerCase();
                const content = await fileStore.read(filePath.toString());
                const spawnPointsSchemas: Array<dataMapRecordType> = this.SpawnPoints.get(location) ?? [];
                for (const spawnPoint of content.data["spawnpointsForced"]) {
					spawnPoint["__location"] = location;
                    spawnPointsSchemas.push({ data: spawnPoint, tags: ["vanilla"] });
                }
                this.SpawnPoints.set(location, spawnPointsSchemas);
            }
        },
        async load() {
            if (!isElectron()) return;
            const fileStore = useFileDataStore();
            for (const filePath of await new Path(
                await window.electronAPI.getDataDir(),
                "locations/*/looseLoot.json"
            ).findFiles()) {
                console.log(filePath.toString(), filePath.dirname(), filePath.dirname().basename());
            }
        },
        getSpawnPointsForItem(itemId: string): LootLocationSchema[] {
            const res: LootLocationSchema[] = [];
            for (const [location, spawnPoints] of this.SpawnPoints.entries()) {
                for (const spawnPoint of spawnPoints) {
                    if (getValuesByPath(spawnPoint.data, "template.Items.*._tpl").includes(itemId)) {
                        res.push(new LootLocationSchema(spawnPoint.data));
                    }
                }
            }
            return res;
        },
    },
});
