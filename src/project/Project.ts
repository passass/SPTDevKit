import { useDataStore } from "@/stores/dataStore";
import Traders from "./Traders";
import Quests, { questDataStore } from "./Quests";
import { Path, PathArray } from "@/utils/pathUtils"
import { availableLocales, suffixes } from "@/types/localization";
import { deepClone, isElectron } from "@/utils/utils";
import { useProfilesStore } from "@/stores/profileStore";
import Items from "./Items";
import { lootSpawns } from "@/project/LootSpawns";
import { currentProjectTag, modTag, vanillaTag, type ProjectArgs } from "../consts/ProjectConsts";
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

		const prePromises = [
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
        ]

		for (const projectObject of ProjectObjects) {
			if ("loadFromEFT" in projectObject) {
				prePromises.push(projectObject.loadFromEFT(this.EFTFolder))
			}
		}

		await Promise.all(prePromises);
    }

    async init() {
		const promises = [];
        for (const projectObject of ProjectObjects) {
			if ("init" in projectObject && typeof projectObject.init === "function")
				projectObject.init()
			if ("asyncInit" in projectObject && typeof projectObject.asyncInit === "function")
				promises.push(projectObject.asyncInit())
		}
		await Promise.all(promises);
        if (!isElectron()) return;
        this.dataStore ??= useDataStore();
        const savedEftPath = localStorage.getItem("eftFolderPath");
        if (savedEftPath) {
            await this.loadEFT(new Path(savedEftPath));
        }
	}

	async backupDb() {
		if (!this.currentProjectFolder) return null;

		const dbPath = new Path(this.currentProjectFolder, "db");
		if (!(await dbPath.exists())) return null;

		const timestamp = new Date()
			.toISOString()
			.replace(/[:.]/g, "-")
			.replace("T", "_")
			.slice(0, 19); // YYYY-MM-DD_HH-mm-ss

		const backupPath = new Path(
			this.currentProjectFolder,
			"_backups",
			`db_${timestamp}`
		);

		const res = await window.electronAPI.copyDir(
			dbPath.toString(),
			backupPath.toString()
		);
	}

	async saveProject(saveWithOriginalChanges?: boolean) {
		if (!this.currentProjectFolder) return;
		await this.backupDb();
		const promises = [];
		const projectArgs: ProjectArgs = {
			folderPath: this.currentProjectFolder,
			saveWithOriginalChanges: saveWithOriginalChanges
		}
		const dataStore = useDataStore()
		for (const storeId of dataStore.getKeys()) {
			if (!dataStore.isArray(storeId))
				for (const [id, record] of dataStore.getMap(storeId).entries()) {
					if (record.tags?.includes(vanillaTag) && record.dirty) {
						const index = record.tags.findIndex((el) => el === vanillaTag)
						if (index >= 0) {
							const newTags = deepClone(record.tags)
							newTags[index] = currentProjectTag
							record.tags = newTags
						}
					}
				}
		}
		for (const projectObject of ProjectObjects) {
			if ("saveProject" in projectObject && typeof projectObject.saveProject === "function")
				promises.push(projectObject.saveProject(projectArgs));
		}
		await Promise.all(promises);
    }

    isOpened() {
        return !!this.currentProjectFolder;
	}

	constructor() { }
}

export default new Project();
