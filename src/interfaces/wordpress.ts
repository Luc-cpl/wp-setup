import { ComposeExecInterface, VolumeInterface } from "./docker";

export interface SetupInterface {
	cliContainer: string;
	host: string;
	multisite: boolean|'subdomain'|'subdirectory';
	plugins: VolumeInterface[]
	themes: VolumeInterface[]
	exec: ComposeExecInterface;
}

export interface RunSetupInterface {
	(config: SetupInterface): Promise<void>;
}

export interface InstallInterface {
	(cliContainer: string, host: string, multisite: boolean|'subdirectory'|'subdomain', exec: ComposeExecInterface): Promise<void>;
}

export interface PluginHandlerInterface {
	(cliContainer: string, plugin: string|string[], exec: ComposeExecInterface): Promise<boolean>;
}

export interface MultisitePluginHandlerInterface {
	(cliContainer: string, plugin: string|string[], exec: ComposeExecInterface, multisite: boolean): Promise<boolean>;
}
