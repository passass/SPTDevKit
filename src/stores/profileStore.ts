import { defineStore } from "pinia";
import { isElectron } from "@/utils/utils";
import { generateUUID24chars } from "@/utils/uuidUtils";
import { gameLocalization } from "@/types/localization";
import { Path } from "@/utils/pathUtils";
import { useFileDataStore } from "@/stores/fileStore";
import { deepClone } from "@/utils/utils";
import type { SchemaData } from "@/types/fields/fields";

export interface WeaponBuildItem {
    _id: string;
    _tpl: string;
    upd?: SchemaData;
    slotId?: string;
    parentId?: string;
}

export interface WeaponBuild {
    Root: string;
    Items: Array<WeaponBuildItem>;
    Id: string;
	Name: string;
    needLocalization?: boolean;
}

export function objectChangeAllIds(result: Array<WeaponBuildItem>, _idsChange?: Map<string, string>) {
	const idsChange = _idsChange ?? new Map<string, string>();
	for (const item of result) {
		if (item.parentId && idsChange.has(item.parentId)) {
			item.parentId = idsChange.get(item.parentId);
		};
		const newId = generateUUID24chars();
		idsChange.set(item._id, newId);
		item._id = newId;


		for (const [key, value] of Object.entries(item)) {
			if (Array.isArray(value)) {
				objectChangeAllIds(value, idsChange)
			}
		}
    }
}

export const useProfilesStore = defineStore("profiles", {
    state: () => ({
        profiles: {} as Record<string, any>,
		selectedProfile: undefined as string | undefined,
        defaultPresets: undefined as WeaponBuild[] | undefined,
    }),
    actions: {
        async load(EFTFolder: Path) {
            if (!isElectron()) return;
            const fileStore = useFileDataStore();
            this.profiles = {};
            this.selectedProfile = undefined;

            const profilesPaths = await EFTFolder.findFiles("SPT*/user/profiles/*.json");
            for (const profilePath of profilesPaths) {
                const profile = await (await fileStore.read(profilePath.filePath)).data;
                const username = profile?.info?.username;
                if (username) {
                    this.profiles[username] = profile;
                    if (!this.selectedProfile) this.selectedProfile = username;
                }
			}

			for (const filePath of await new Path(EFTFolder, "SPT*/SPT_Data/database/globals.json").findFiles()) {
				if (!filePath.exists()) continue;
				const globalsFile = await fileStore.read(filePath.filePath);
				const data = globalsFile.data;
				if (!data) continue;
				const defaultPresets: WeaponBuild[] = [];

				for (const preset of Object.values(data.ItemPresets)) {
					if (
						preset && typeof preset === "object"
						&& "_items" in preset && Array.isArray(preset._items) && preset._items.length > 0
						&& "_id" in preset
						&& "_name" in preset
						&& "_encyclopedia" in preset
					) {

						defaultPresets.push({
							Items: preset._items as WeaponBuildItem[],
							Root: preset._items[0]._id as string,
							Id: preset._id as string,
							Name: preset._encyclopedia as string,
							needLocalization: true,
						});
					}

				}

				this.defaultPresets = defaultPresets;
				break
			}
		},
        getProfile(name: string): any {
            return this.profiles[name];
        },
        getCurrentProfile(): any {
            if (!this.selectedProfile) return undefined;
            return this.getProfile(this.selectedProfile);
        },
        getWeaponBuilds(): WeaponBuild[] {
            if (!this.selectedProfile) return this.defaultPresets ?? [];
            const profile = this.getCurrentProfile();
            return [...(this.defaultPresets ?? []), ...(profile?.userbuilds?.weaponBuilds ?? [])];
        },
        getWeaponBuild(name: string): WeaponBuild | undefined {
            return this.getWeaponBuilds().find((build) => build.Name === name);
        },
        getWeaponBuildItems(name: string): WeaponBuildItem[] {
            const weaponBuild = this.getWeaponBuild(name);
            if (!weaponBuild) return [];
            const weaponBuildItems = weaponBuild.Items.filter((item) => item.slotId !== "patron_in_weapon");
            const result = deepClone(weaponBuildItems);

            objectChangeAllIds(result)
            return result;
        },
    },
});
