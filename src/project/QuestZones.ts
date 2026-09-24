import { Path } from "@/utils/pathUtils";
import { currentProjectTag, type ProjectArgs } from "../consts/ProjectConsts";
import { useFileDataStore } from "@/stores/fileStore";
import { dataStore } from "@/stores/dataStore";
import { ZoneSchema } from "@/types/schemas/questsZones";
import type { onFileLoadContext } from "@/consts/DataStoreConsts";
import type { RecordSchema } from "@/types/fields/fields";
import { deepClone } from "@/utils/utils";

const questZonesStore = new dataStore("questsZones");
const EXCLUDED_ZONE_LOCATIONS = new Set(["Sandbox_high", "Factory4_night"]);
const ZONE_LOCATION_DUPLICATES: Record<string, string> = {
    Sandbox: "Sandbox_high",
    Factory4_day: "Factory4_night",
};

class QuestZones {
    ensureStore() {
        if (!questZonesStore.isInited()) {
			questZonesStore.register({
				file: [], schemaType: ZoneSchema, isArray: true,
				onFileLoad: (ctx: onFileLoadContext) => {
                    const res: RecordSchema[] = [];
                    const content = ctx.content.data;
                    const zones = Array.isArray(content) ? content : [];
                    for (const zoneData of zones) {
                        if (!zoneData || typeof zoneData !== "object") continue;
                        const loc = (zoneData as any)["ZoneLocation"];
                        if (typeof loc === "string" && EXCLUDED_ZONE_LOCATIONS.has(loc)) continue;
                        res.push(ZoneSchema.from(zoneData));
                    }
                    return res;
                },
			});
        }
    }

    async saveProject(projectArgs: ProjectArgs) {
        await window.electronAPI.removeFolder(new Path(projectArgs.folderPath, "db/CustomQuestZones").toString())
        const questZones = questZonesStore.getByTagInStore(currentProjectTag);
        const res: any[] = [];
        const seenLocations = new Set<string>();

        for (const questZone of questZones.values()) {
            const loc = questZone.data.get("ZoneLocation");
            if (typeof loc === "string" && EXCLUDED_ZONE_LOCATIONS.has(loc)) continue;
            if (typeof loc === "string") seenLocations.add(loc);
            res.push(questZone.data.toJSON());
        }

        for (const [sourceLoc, targetLoc] of Object.entries(ZONE_LOCATION_DUPLICATES)) {
            if (!seenLocations.has(sourceLoc)) continue;
            for (const questZone of questZones.values()) {
                if (questZone.data.get("ZoneLocation") !== sourceLoc) continue;
                const duplicated = deepClone(questZone.data.toJSON());
                duplicated["ZoneLocation"] = targetLoc;
                res.push(duplicated);
            }
        }

        new Path(projectArgs.folderPath, "db/CustomQuestZones/zones.json").saveFile(res);
    }

	clearProject() {
		questZonesStore.clearStoreFromObjectWithTags(currentProjectTag);
    }

    init() {
        this.ensureStore();
    }

    async loadFromMod(projectArgs: ProjectArgs) {
        for (const filePath of await new Path(projectArgs.folderPath, "db/CustomQuestZones/*.json").findFiles()) {
            questZonesStore.addFileToStore({ filename: filePath.toString(), tags: projectArgs.tags ?? [] });
        }
        if (!projectArgs.notLoadImmediately) await questZonesStore.load();
    }
}

export default new QuestZones();
