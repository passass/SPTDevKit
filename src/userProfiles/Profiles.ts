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

class Profiles {
	profiles: Record<string, any> = {};
	selectedProfile: string | undefined;

	async load(EFTFolder: Path) {
		if (!isElectron()) return;
		const fileStore = useFileDataStore();
		const profilesPaths = await EFTFolder.findFiles("SPT*/user/profiles/*.json");

		this.profiles = {};
		for (const profilePath of profilesPaths) {
			const profile = await (await fileStore.read(profilePath.filePath)).data
			this.profiles[profile?.info?.username] = profile;
			if (!this.selectedProfile) this.selectedProfile = profile?.info?.username;
		}

		console.log(this.selectedProfile)
	}

	getProfile(name: string): any {
		return this.profiles[name];
	}

	getCurrentProfile(): any {
		if (!this.selectedProfile) return undefined;
		return this.profiles[this.selectedProfile];
	}

	getWeaponBuildItems(name: string): WeaponBuildItem[] {
		const weaponBuild = this.getWeaponBuild(name);
		const weaponBuildItems = weaponBuild?.Items
		if (!weaponBuildItems) return [];
		const result = deepClone(weaponBuildItems)
		for (const item of result) {
			item._id = generateUUID24chars()
		}
		return result;
	}

	getWeaponBuild(name: string): WeaponBuild | undefined {
		return this.getWeaponBuilds().find((build) => build.Name === name);
	}

	getWeaponBuilds(): WeaponBuild[] {
		if (!this.selectedProfile) return [];
		return this.profiles[this.selectedProfile]?.userbuilds?.weaponBuilds ?? [];
	}
}

export default new Profiles();
