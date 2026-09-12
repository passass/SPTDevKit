import { useDataStore } from "@/stores/dataStore";

const generatedUUID24chars = new Set<string>();
export function generateUUID24chars(): string {
	const dataStore = useDataStore();
    let uuid: string;
    do {
        uuid = 'xxxxxxxxxxxxxxxxxxxxxxxx'.replace(/[x]/g, () => {
            return Math.floor(Math.random() * 16).toString(16);
        });
    } while (generatedUUID24chars.has(uuid) || dataStore.allIds.has(uuid));
    generatedUUID24chars.add(uuid);
    return uuid;
}
