import { useDataStore } from "@/stores/dataStore";
import Traders from "./Traders";
import Quests, { questDataStore } from "./Quests";
import { Path, PathArray } from "@/utils/pathUtils"
import { availableLocales, suffixes } from "@/types/localization";
import { deepClone, isElectron } from "@/utils/utils";
import { useProfilesStore } from "@/stores/profileStore";
import Items from "./Items";
import { lootSpawns } from "@/project/LootSpawns";
import { currentProjectTag, modTag, type ProjectArgs } from "../consts/ProjectConsts";
import Locales from "./Locales";
import RecentProjects from "./RecentProjects";
import QuestZones from "./QuestZones";
import TradersAssort from "./TradersAssort";

const ProjectObjects = [
	Quests,
	Items,
	Traders,
	Locales,
	lootSpawns,
	QuestZones,
	TradersAssort,
]

class Project {
    dataStore: ReturnType<typeof useDataStore> | null = null;
    EFTFolder?: Path;
	currentProjectFolder?: Path;

	async loadSPTModFolder(projectArgs: ProjectArgs) {
		const promises = [];
		for (const projectObject of ProjectObjects) {
			if ("loadFromMod" in projectObject) promises.push(projectObject.loadFromMod(projectArgs))
		}
        await Promise.all(promises);
	}

	clearProjectObjects() {
		for (const projectObject of ProjectObjects) {
			if ("clearProject" in projectObject) projectObject.clearProject()
		}
	}

	async loadProject(folderPath: Path) {
		this.currentProjectFolder = folderPath;
		RecentProjects.addRecentProject(folderPath.toString());
		this.clearProjectObjects();
		await this.loadSPTModFolder({
            folderPath: folderPath,
            tags: [currentProjectTag],
        });
    }

    async loadEFT(folderPath: Path) {
		this.EFTFolder = folderPath;
        const profilesStore = useProfilesStore();
        for (const folderPath of await new Path(this.EFTFolder, "SPT*/user/mods/*").findFolders()) {
            await this.loadSPTModFolder({
                folderPath: folderPath,
                tags: [modTag],
                notLoadImmediately: true,
            });
		}

		await Promise.all([
			lootSpawns.loadFromEFT(this.EFTFolder),
			profilesStore.load(this.EFTFolder),
            this.dataStore?.load("quests"),
            async () => {
                for (const locale of availableLocales)
                    for (const suffix of Object.values(suffixes)) this.dataStore?.load(`${locale}${suffix}`);
            },
            this.dataStore?.load("traders"),
            this.dataStore?.load("items"),
            this.dataStore?.load("questsZones"),
            this.dataStore?.load("TraderAssort"),
        ]);
    }

    async init() {
		await Traders.load();
        for (const projectObject of ProjectObjects) {
            if ("init" in projectObject && typeof projectObject.init === "function") projectObject.init()
        }
        if (!isElectron()) return;
        this.dataStore ??= useDataStore();
        const savedEftPath = localStorage.getItem("eftFolderPath");
        if (savedEftPath) {
            await this.loadEFT(new Path(savedEftPath));
        }
    }

	async saveProject() {
		if (!this.currentProjectFolder) return;
		const promises = [];
		for (const projectObject of ProjectObjects) {
			if ("saveProject" in projectObject && typeof projectObject.saveProject === "function") promises.push(projectObject.saveProject(this.currentProjectFolder));
		}
		await Promise.all(promises);
    }

    isOpened() {
        return !!this.currentProjectFolder;
	}

	constructor() { }
}

export default new Project();
