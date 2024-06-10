import { ExecSyncOptions } from "child_process";
import { VolumeInterface } from "./docker";

interface LocalExecInterface {
	(command: string, options?: ExecSyncOptions): Promise<string | Buffer>;
}

export interface SetupInterface {
	cliContainer: string;
	host: string;
	multisite: boolean|'subdomain'|'subdirectory';
	plugins: VolumeInterface[];
	themes: VolumeInterface[];
	exec: LocalExecInterface;
}

export interface RunSetupInterface {
	(config: SetupInterface): Promise<void>;
}

export interface InstallInterface {
	(cliContainer: string, host: string, multisite: boolean|'subdirectory'|'subdomain', exec: LocalExecInterface): Promise<void>;
}

export interface PluginHandlerInterface {
	(cliContainer: string, plugin: string|string[], exec: LocalExecInterface): Promise<boolean>;
}

export interface MultisitePluginHandlerInterface {
	(cliContainer: string, plugin: string|string[], exec: LocalExecInterface, multisite: boolean): Promise<boolean>;
}
