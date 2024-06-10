import { VolumeInterface } from "./docker";

export interface VSCodeConfigInterface {
    [key: string]: unknown;
    extensions: Array<string>;
    settings: {
        [key: string]: unknown;
    };
}

export interface ConfigInterface {
    [key: string]: unknown;
    editor: 'vscode' | null;
    include: string;
    host: string;
    multisite: boolean|'subdomain'|'subdirectory';
    plugins: Array<string|VolumeInterface>;
    themes: Array<string|VolumeInterface>;
    volumes: Array<string|VolumeInterface>;
    editorConfig: {
        vscode: VSCodeConfigInterface;
    };
}