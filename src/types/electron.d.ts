import type { Entry } from "fast-glob";

export interface ElectronAPI {
    readLocalJson: (filename: string) => Promise<{
        success: boolean;
        data: any;
        error?: string;
        path?: string;
    }>;
    readJson(filepath: string): Promise<{
        success: boolean;
        data: any;
        error?: string;
        path?: string;
    }>;
    readFile: (filePath: string) => Promise<{
        success: boolean;
        data: Buffer;
        error?: string;
        path?: string;
    }>;

    getVersions: () => Promise<{
        node: string;
        electron: string;
        chrome: string;
        app: string;
    }>;

    writeJson: (filePath: string, data: any) => Promise<{ success: boolean; error?: string }>;
    writeLocalJson: (filename: string, data: any) => Promise<{ success: boolean; error?: string }>;
    getDataDir: () => Promise<string>;

    removeFolder: (filePath: string) => Promise<{ success: boolean; error?: any }>;
    findFilesSync: (pattern: string) => Promise<string[]>;
    findFolders: (pattern: string) => Promise<string[]>;
    findFiles: (pattern: string) => Promise<string[]>;
    fileExists: (filePath: string) => Promise<boolean>;

    selectFolder: () => Promise<string | null>;
    selectFile: (args: {
        title?: string;
        buttonLabel?: string;
        filters?: Array<{
            name: string;
            extensions: string[];
        }>;
    }) => Promise<{
        success: boolean;
        canceled?: boolean;
        path?: string;
        error?: string;
    }>;

    copyFile: (
        sourcePath: string,
        destinationPath: string
    ) => Promise<{
        success: boolean;
        path?: string;
        error?: string;
    }>;

    pathUtils: {
        isAbsolute(filePath: string): boolean;
        join: (...args: string[]) => string;
        basename: (filePath: string) => string;
        dirname: (filePath: string) => string;
        relative: (filePath1: string, filePath2: string) => string;
    };

    send: (channel: string, data: any) => void;
    receive: (channel: string, func: (...args: any[]) => void) => void;
}

declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}

export {};
