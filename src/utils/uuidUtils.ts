const generatedUUID24chars = new Set<string>();
export function generateUUID24chars(): string {
    let uuid: string;
    do {
        uuid = 'xxxxxxxxxxxxxxxxxxxxxxxx'.replace(/[x]/g, () => {
            return Math.floor(Math.random() * 16).toString(16);
        });
    } while (generatedUUID24chars.has(uuid));
    generatedUUID24chars.add(uuid);
    return uuid;
}
