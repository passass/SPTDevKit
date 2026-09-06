import { type ProjectArgs } from "./Project";
import { Path } from "../utils/pathUtils";
import { useDataStore } from "@/stores/dataStore";
import { itemsSchema } from "@/types/schemas/items2";

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
