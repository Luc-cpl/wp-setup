import { ExecSyncOptions } from "child_process";

export interface VolumeInterface {
    host: string;
    container: string;
}

export interface ComposeExecInterface {
	(command: string, files?: string[] | null, options?: ExecSyncOptions): string | Buffer;
}