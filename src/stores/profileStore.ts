import { defineStore } from "pinia";
import { generateUUID24chars, isElectron } from "@/utils/utils";
import { Path } from "@/utils/pathUtils";
import { useFileDataStore } from "@/stores/fileStore";
import { deepClone } from "@/utils/utils";

export interface WeaponBuildItem {
    _id: string;
    _tpl: string;
    upd?: Record<string, any>;
    slotId?: string;
    parentId?: string;
}

export interface WeaponBuild {
    Root: string;
    Items: Array<WeaponBuildItem>;
    Id: string;
    Name: string;
}

export const useProfilesStore = defineStore("profiles", {
    state: () => ({
        profiles: {} as Record<string, any>,
        selectedProfile: undefined as string | undefined,
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
            console.log(this.selectedProfile);
        },
        getProfile(name: string): any {
            return this.profiles[name];
        },
        getCurrentProfile(): any {
            if (!this.selectedProfile) return undefined;
            return this.getProfile(this.selectedProfile);
        },
        getWeaponBuilds(): WeaponBuild[] {
            if (!this.selectedProfile) return [];
            const profile = this.getCurrentProfile();
            return profile?.userbuilds?.weaponBuilds ?? [];
        },
        getWeaponBuild(name: string): WeaponBuild | undefined {
            return this.getWeaponBuilds().find((build) => build.Name === name);
        },
        getWeaponBuildItems(name: string): WeaponBuildItem[] {
            const weaponBuild = this.getWeaponBuild(name);
            if (!weaponBuild) return [];
            const weaponBuildItems = weaponBuild.Items.filter((item) => item.slotId !== "patron_in_weapon");
            const result = deepClone(weaponBuildItems);

            const idsChange = new Map<string, string>();
			for (const item of result) {
				if (item.parentId && idsChange.has(item.parentId)) {
					item.parentId = idsChange.get(item.parentId);
				};
				const newId = generateUUID24chars();
				idsChange.set(item._id, newId);
				item._id = newId;
            }
            return result;
        },
    },
});
