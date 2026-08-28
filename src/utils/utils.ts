export function generateUUID24chars(): string {
    return 'xxxxxxxxxxxxxxxxxxxxxxxx'.replace(/[x]/g, () => {
        return Math.floor(Math.random() * 16).toString(16);
    });
}

export function capitalize(str: string) {
    if (!str) return str;
    return str[0].toUpperCase() + str.slice(1);
}

export function isElectron() {
    return window && window.electronAPI !== undefined;
}