import { useDataStore } from "@/stores/dataStore";
import Traders from "./Traders";
import Quests, { questDataStore } from "./Quests";
import { Path, PathArray } from "@/utils/pathUtils"
import { availableLocales, suffixes } from "@/types/localization";
import { deepClone, isElectron } from "@/utils/utils";
import { useProfilesStore } from "@/stores/profileStore";
import Items from "./Items";
import { useLootSpawns } from "@/project/LootSpawns";
import { currentProjectTag, modTag, type ProjectArgs } from "./ProjectConsts";
import Locales from "./Locales";
import RecentProjects from "./RecentProjects";


class Project {
    dataStore: ReturnType<typeof useDataStore> | null = null;
    EFTFolder?: Path;
	currentProjectFolder?: Path;

	async loadSPTModFolder(projectArgs: ProjectArgs) {
		const lootSpawnStore = useLootSpawns();
        await Promise.all([
            Quests.loadQuests(projectArgs),
            Items.loadItems(projectArgs),
            Traders.loadTraders(projectArgs),
			Locales.loadLocale(projectArgs),
            lootSpawnStore.loadLocations(projectArgs)
        ]);
	}

	clearProjectObjects() {
		Items.clearProject();
		Quests.clearProject();
	}

	async loadProject(folderPath: Path) {
		this.currentProjectFolder = folderPath;
		RecentProjects.addRecentProject(folderPath.toString());
		this.clearProjectObjects();
		console.log("quests before ", (questDataStore.config?.file as Array<any>).length, deepClone(questDataStore.config?.file))
		await this.loadSPTModFolder({
            folderPath: folderPath,
            tags: [currentProjectTag],
        });
		console.log("quests after ", (questDataStore.config?.file as Array<any>).length, deepClone(questDataStore.config?.file))
    }

    async loadEFT(folderPath: Path) {
		this.EFTFolder = folderPath;
		const lootSpawnStore = useLootSpawns();
        const profilesStore = useProfilesStore();
        for (const folderPath of await new Path(this.EFTFolder, "SPT*/user/mods/*").findFolders()) {
            await this.loadSPTModFolder({
                folderPath: folderPath,
                tags: [modTag],
                notLoadImmediately: true,
            });
		}

		await Promise.all([
			lootSpawnStore.loadFromEFT(this.EFTFolder),
			profilesStore.load(this.EFTFolder),
            this.dataStore?.load("quests"),
            async () => {
                for (const locale of availableLocales)
                    for (const suffix of Object.values(suffixes)) this.dataStore?.load(`${locale}${suffix}`);
            },
            this.dataStore?.load("traders"),
            this.dataStore?.load("items"),
        ]);
    }

    async init() {
        await Traders.load();
        if (!isElectron()) return;
        this.dataStore ??= useDataStore();
        const savedEftPath = localStorage.getItem("eftFolderPath");
        if (savedEftPath) {
            await this.loadEFT(new Path(savedEftPath));
        }
    }

	async saveProject() {
        if (!this.currentProjectFolder) return;
		await
			Promise.all([
				Quests.saveProject(this.currentProjectFolder),
				Items.saveProject(this.currentProjectFolder)
			])
    }

    isOpened() {
        return !!this.currentProjectFolder;
	}

	constructor() { }
}

export default new Project();
