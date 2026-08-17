export function generateUUID24chars(): string {
    return 'xxxxxxxxxxxxxxxxxxxxxxxx'.replace(/[x]/g, () => {
        return Math.floor(Math.random() * 16).toString(16);
    });
}