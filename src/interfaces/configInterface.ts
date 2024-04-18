import VolumeInterface from "./volumeInterface";

export default interface ConfigInterface {
    include: string;
    plugins: string[]|VolumeInterface[];
    themes: string[]|VolumeInterface[];
    volumes: string[]|VolumeInterface[];
}