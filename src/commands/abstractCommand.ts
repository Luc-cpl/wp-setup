import { execSync } from 'child_process';
import { exit } from 'process';

import ConfigInterface from '../interfaces/configInterface';

import { parseVolume } from '../helpers/docker';

/**
 * @abstract
 */
export default abstract class AbstractCommand {
	private config = {} as ConfigInterface;
	protected mode = 'silent';

	constructor(config: ConfigInterface) {
		this.setUser();
		this.config = this.parseConfig(config);
	}

	private setUser() {
		const uid = execSync('id -u', { stdio: 'pipe' }).toString().trim();
		const gid = execSync('id -g', { stdio: 'pipe' }).toString().trim();
		process.env.UID = uid;
		process.env.GID = gid;
	}

	private parseConfig(config: ConfigInterface): ConfigInterface {
		config.plugins = (config.plugins ?? []).map(parseVolume);
		config.themes = (config.themes ?? []).map(parseVolume);
		config.volumes = (config.volumes ?? []).map(parseVolume);

		return config
	}

	protected getConfig = () => this.config;

	protected print(message: string, type = 'info') {
		if (this.mode === 'silent' && type !== 'error' && type !== 'success') {
			return;
		}

		const call = type in console ? console[type as keyof Console] as Function : console.log;
		call(message);
	}

	protected error(message: string, shouldExit = true) {
		this.print(message, 'error');
		if (shouldExit) {
			exit(1);
		}
	}

	protected success(message: string|null = null, shouldExit = true) {
		if (message) {
			this.print(message, 'success');
		}
		if (shouldExit) {
			exit(0);
		}
	}
}