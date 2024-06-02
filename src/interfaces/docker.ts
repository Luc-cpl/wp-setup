import { ExecSyncOptions } from "child_process";
import { ConfigInterface } from "./setup";

export interface VolumeInterface {
    host: string;
    container: string;
}

export interface ComposeExecInterface {
	(config: ConfigInterface, command: string, options?: ExecSyncOptions): Promise<string | Buffer>;
}

export interface DockerPsItem {
	State: string;
	Service: string;
}