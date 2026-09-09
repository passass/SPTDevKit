import { defineStore } from "pinia";
import { LootLocationSchema } from "@/types/schemas/lootLocation";
import { Path } from "@/utils/pathUtils";
import { useFileDataStore } from "@/stores/fileStore";
import { getValuesByPath, isElectron, toJsonObject } from "@/utils/utils";

export const useLootSpawns = defineStore("lootSpawns", {
    state: () => ({
        // location -> spawnpoints
        SpawnPoints: new Map<string, Array<Record<string, any>>>(),
    }),
    actions: {
		async loadLocations(currentProjectFolder: Path) {
			if (!isElectron()) return;
			// this.SpawnPoints.clear()
            const fileStore = useFileDataStore();
            const path = new Path(currentProjectFolder, `db/CustomLootspawns/CustomSpawnpointsForced/*.json`);
            const files = await path.findFiles();
            for (const file of files) {
				const content = await fileStore.read(file.toString());
				for (const [location, spawnPoints] of Object.entries(content.data)) {
					if (!Array.isArray(spawnPoints)) continue;
					const key = location.toLowerCase();
                    const spawnPointsSchemas: Array<Record<string, any>> = this.SpawnPoints.get(key) ?? [];

					for (const spawnPoint of spawnPoints) {
						spawnPoint["__location"] = location;
                        spawnPointsSchemas.push(spawnPoint);
                    }
					this.SpawnPoints.set(key, spawnPointsSchemas);
                }
			}


			// fileStore.write("lootSpawns.json", JSON.stringify(toJsonObject(this.SpawnPoints), null, 2) );
		},
		async loadFromEFT(EFTFolder: Path) {
			if (!isElectron()) return;
			const fileStore = useFileDataStore();
			for (const filePath of await new Path(EFTFolder, "SPT*/SPT_Data/database/locations/*/looseLoot.json").findFiles()) {
				const location = filePath.dirname().basename().toLowerCase();
				const content = await fileStore.read(filePath.toString());
				const spawnPointsSchemas: Array<Record<string, any>> = this.SpawnPoints.get(location) ?? [];
				for (const spawnPoint of content.data["spawnpointsForced"]) {
					spawnPoint["__location"] = location;
                    spawnPointsSchemas.push(spawnPoint);
				}
				this.SpawnPoints.set(location, spawnPointsSchemas);
			}
		},
		async load() {
			if (!isElectron()) return;
			const fileStore = useFileDataStore();
			for (const filePath of await new Path(await window.electronAPI.getDataDir(), "locations/*/looseLoot.json").findFiles()) {
				console.log(filePath.toString(), filePath.dirname(), filePath.dirname().basename())
			}
		},
		getSpawnPointsForItem(itemId: string): LootLocationSchema[] {
			const res: LootLocationSchema[] = []
			for (const [location, spawnPoints] of this.SpawnPoints.entries()) {
                for (const spawnPoint of spawnPoints) {
                    if (getValuesByPath(spawnPoint, "template.Items.*._tpl").includes(itemId)) {
                        res.push(new LootLocationSchema(spawnPoint));
                    }
                }
            }
			return res;
		},
    },
});
