import { Path } from "@/utils/pathUtils";
import { currentProjectTag, type ProjectArgs } from "../consts/ProjectConsts";
import { useFileDataStore } from "@/stores/fileStore";
import { dataStore } from "@/stores/dataStore";
import { ZoneSchema } from "@/types/schemas/questsZones";
import { generateUUID24chars } from "@/utils/uuidUtils";
import { toJsonObject } from "@/utils/utils";

const questZonesStore = new dataStore("questsZones");

class QuestZones {
    ensureStore() {
        if (!questZonesStore.isInited()) {
            questZonesStore.register({ file: [], schemaType: ZoneSchema, isArray: true });
        }
    }

    async saveProject(currentProjectFolder: Path) {
        const questZones = questZonesStore.getByTagInStore(currentProjectTag);
        const res = [];
        for (const questZone of questZones.values()) {
            res.push(questZone.data.toJSON());
        }

        new Path(currentProjectFolder, "db/CustomQuestZones/zones.json").saveFile(res);
    }

    clearProject() {}

    init() {
        this.ensureStore();
    }

    async loadFromMod(projectArgs: ProjectArgs) {
        const fileStore = useFileDataStore();
        for (const filePath of await new Path(projectArgs.folderPath, "db/CustomQuestZones/*.json").findFiles()) {
            questZonesStore.addFileToStore({ filename: filePath.toString(), tags: projectArgs.tags });
        }
    }
}

export default new QuestZones();
