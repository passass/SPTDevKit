import { Path } from "@/utils/pathUtils";
import { type ProjectArgs } from "../consts/ProjectConsts";
import { useFileDataStore } from "@/stores/fileStore";
import { dataStore } from "@/stores/dataStore";
import { ZoneSchema } from "@/types/schemas/questsZones";
import { generateUUID24chars } from "@/utils/uuidUtils";

const questZonesStore = new dataStore("questsZones");

class QuestZones {
    ensureStore() {
        if (!questZonesStore.isInited()) {
            questZonesStore.register({ file: [], schemaType: ZoneSchema });
        }
	}

	clearProject() {

	}

	init() {
		console.log("QuestZones init")
		this.ensureStore();
	}

	async loadFromMod(projectArgs: ProjectArgs) {
		const fileStore = useFileDataStore();
        for (const filePath of await new Path(projectArgs.folderPath, "db/CustomQuestZones/*.json").findFiles()) {
			const content = await fileStore.read(filePath.toString());
            const id = generateUUID24chars();
            questZonesStore.addSchema(id, content.data)
        }
    }
}

export default new QuestZones();
