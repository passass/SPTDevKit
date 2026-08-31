import { useDataStore } from "@/stores/dataStore";
import Traders from "./Traders";
import Quests from "./Quests";
import { availableLocales, suffixes } from "@/types/localization";
import { Path, PathArray } from "@/utils/pathUtils";
import { isElectron } from "@/utils/utils";
import Profiles from "@/userProfiles/Profiles";

export const currentProjectTag = "currentProject";
export const modTag = "mod";

export type ProjectArgs = {
    folderPath: Path;
    notLoadImmediately?: boolean;
    tags: string[];
};

class Project {
    dataStore: ReturnType<typeof useDataStore> | null = null;
    EFTFolder?: Path;
	currentProjectFolder?: Path;

    async loadLocale(projectArgs: ProjectArgs) {
        const customQuestsPath = new Path(projectArgs.folderPath, "db/CustomQuests");
        const storeIds: Set<string> = new Set();
        for (const traderQuestPath of await customQuestsPath.findFolders("*")) {
            const traderId = customQuestsPath.relative(traderQuestPath);
            const localesFolderPath = new Path(traderQuestPath, "Locales");
            for (const locale of availableLocales) {
                const localeFilePath = localesFolderPath.join(`${locale}.json`);
                if (await localeFilePath.exists()) {
                    const storeId = `${locale}${suffixes.localizationSuffix}`;
                    storeIds.add(storeId);
                    this.dataStore?.addFileToStore(storeId, {
                        filename: localeFilePath.toString(),
                        tags: [...projectArgs.tags, "locales", traderId.basename()],
                    });
                }
            }
        }
        const localeFiles = await new Path(projectArgs.folderPath, "db/CustomLocales/*.json").findFiles();
        for (const localeFilePath of localeFiles) {
            const locale = localeFilePath.stem();
            if (!availableLocales.includes(locale)) continue;
            const storeId = `${locale}${suffixes.localizationSuffix}`;
            storeIds.add(storeId);
            this.dataStore?.addFileToStore(storeId, {
                filename: localeFilePath.toString(),
                tags: [currentProjectTag, "locales", locale],
            });
        }
        if (!projectArgs.notLoadImmediately) await this.dataStore?.loadMultiple(Array.from(storeIds.values()));
    }

    async loadTraders(projectArgs: ProjectArgs) {
        await new PathArray(["data/base.json", "db/base.json"], projectArgs.folderPath).forEach((filePath) => {
            Traders.loadAdditionalTrader(filePath.toString(), projectArgs.tags);
        });
        if (!projectArgs.notLoadImmediately) await this.dataStore?.load("traders");
    }

    async loadSPTFolder(projectArgs: ProjectArgs) {
        await Promise.all([
            Quests.loadQuests(projectArgs),
            this.loadTraders(projectArgs),
            this.loadLocale(projectArgs),
        ]);
    }

    async loadProject(folderPath: Path) {
        this.currentProjectFolder = folderPath;
        await this.loadSPTFolder({
            folderPath: folderPath,
            tags: [currentProjectTag],
        });
    }

    async loadEFTMods(folderPath: Path) {
        this.EFTFolder = folderPath;
        for (const folderPath of await new Path(this.EFTFolder, "*/user/mods/*").findFolders()) {
            await this.loadSPTFolder({
                folderPath: folderPath,
                tags: ["mod"],
                notLoadImmediately: true,
            });
        }
		await Promise.all([
			Profiles.load(this.EFTFolder),
            this.dataStore?.load("quests"),
            async () => {
                for (const locale of availableLocales)
                    for (const suffix of Object.values(suffixes)) this.dataStore?.load(`${locale}${suffix}`);
            },
            this.dataStore?.load("traders"),
        ]);
    }

    async init() {
        await Traders.load();
        if (!isElectron()) return;
        this.dataStore ??= useDataStore();
        const savedEftPath = localStorage.getItem("eftFolderPath");
        if (savedEftPath) {
            await this.loadEFTMods(new Path(savedEftPath));
        }
    }

	async saveProject() {
        if (!this.currentProjectFolder) return;
        await Quests.saveProject(this.currentProjectFolder);
    }

    isOpened() {
        return !!this.currentProjectFolder;
    }

    constructor() {}
}

export default new Project();
