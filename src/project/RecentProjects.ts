import { recentProjectsStorageKey, maxRecentProjects } from "./ProjectConsts";


export class RecentProjects {
	getRecentProjects(): string[] {
		try {
			const raw = localStorage.getItem(recentProjectsStorageKey);
			const list = raw ? JSON.parse(raw) : [];
			return Array.isArray(list) ? list.filter((p): p is string => typeof p === "string") : [];
		} catch {
			return [];
		}
	}

	addRecentProject(folderPath: string) {
		if (!folderPath || this.getRecentProjects().includes(folderPath)) return;
		const existing = this.getRecentProjects().filter((p) => p !== folderPath);
		const updated = [folderPath, ...existing].slice(0, maxRecentProjects);
		localStorage.setItem(recentProjectsStorageKey, JSON.stringify(updated));
	}

	removeRecentProject(folderPath: string) {
		const updated = this.getRecentProjects().filter((p) => p !== folderPath);
		localStorage.setItem(recentProjectsStorageKey, JSON.stringify(updated));
	}
}

export default new RecentProjects();
