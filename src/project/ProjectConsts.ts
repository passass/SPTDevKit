import { Path } from "@/utils/pathUtils"
export type ProjectArgs = {
    folderPath: Path;
    notLoadImmediately?: boolean;
    tags: string[];
};
export const currentProjectTag = "currentProject";
export const modTag = "mod";
export const vanillaTag = "vanilla";
export const maxRecentProjects = 3;
