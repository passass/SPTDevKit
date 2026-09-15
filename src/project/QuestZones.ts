import { Path } from "@/utils/pathUtils";
import { currentProjectTag, type ProjectArgs } from "../consts/ProjectConsts";
import { useFileDataStore } from "@/stores/fileStore";
import { dataStore } from "@/stores/dataStore";
import { ZoneSchema } from "@/types/schemas/questsZones";

const questZonesStore = new dataStore("questsZones");

class QuestZones {
    ensureStore() {
        if (!questZonesStore.isInited()) {
            questZonesStore.register({ file: [], schemaType: ZoneSchema, isArray: true });
        }
    }

    async saveProject(projectArgs: ProjectArgs) {
        const questZones = questZonesStore.getByTagInStore(currentProjectTag);
        const res = [];
        for (const questZone of questZones.values()) {
            res.push(questZone.data.toJSON());
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
