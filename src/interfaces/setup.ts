import { VolumeInterface } from "./docker";

export interface ConfigInterface {
    [key: string]: unknown;
    include: string;
    host: string;
    multisite: boolean|'subdomain'|'subdirectory';
    plugins: string[]|VolumeInterface[];
    themes: string[]|VolumeInterface[];
    volumes: string[]|VolumeInterface[];
}