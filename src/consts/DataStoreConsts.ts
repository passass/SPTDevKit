import type { FileConfig } from "@/stores/fileStore";

export interface onFileLoadContext {
	content: FileConfig;
	tags: string[]
}
