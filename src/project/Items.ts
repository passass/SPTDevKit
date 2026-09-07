import { type ProjectArgs, currentProjectTag } from "./Project";
import { Path } from "../utils/pathUtils";
import { useDataStore } from "@/stores/dataStore";
import { itemsSchema } from "@/types/schemas/items";

class Items {
    async loadItems(projectArgs: ProjectArgs) {
	   	const dataStore = useDataStore();
	    const filesFound = await new Path(projectArgs.folderPath, "db/CustomItems/*.json").findFiles();
	    for (const filepath of filesFound) {
	        dataStore.addFileToStore("items", {
	            filename: filepath.filePath,
	            tags: projectArgs.tags,
	        });
	    }
	    if (!projectArgs.notLoadImmediately) await dataStore.load("items");
	}

	async saveProject(currentProjectFolder: Path) {
		const dataStore = useDataStore();
		const res = new Map();
        for (const [itemId, item] of dataStore.getByTagInStore("items", currentProjectTag).entries()) {
            res.set(itemId, item.data);
        }

		await new Path(currentProjectFolder, `db/CustomItems/items.json`).saveFile(res);
	}

	async load() {
		const dataStore = useDataStore();
		dataStore.register("items", {
			file: [
				{
					filename: 'items.json'
					, tags: ["vanilla"]
				}
			],
			schemaType: itemsSchema
		});
	}
}

export default new Items();
