import { execSync } from 'child_process';
import { exit } from 'process';
import { parseVolume } from '../helpers/docker.mjs';

/**
 * @abstract
 */
export default class AbstractCommand {
	#config = {};
	mode = 'silent';

	constructor(config) {
		this.#setUser();
		this.#config = this.#parseConfig(config);
	}

	#setUser() {
		const uid = execSync('id -u', { stdio: 'pipe' }).toString().trim();
		const gid = execSync('id -g', { stdio: 'pipe' }).toString().trim();
		process.env.UID = uid;
		process.env.GID = gid;
	}

	#parseConfig(config) {
		config.plugins = (config.plugins ?? []).map(parseVolume);
		config.themes = (config.themes ?? []).map(parseVolume);
		config.volumes = (config.volumes ?? []).map(parseVolume);

		return config
	}

	__getConfig = () => this.#config;

	__print(message, type = 'info') {
		if (this.mode === 'silent' && type !== 'error' && type !== 'success') {
			return;
		}

		if (console[type] === undefined) {
			return console.log(message);
		}

		console[type](`[${type.toUpperCase()}] ${message}`);
	}

	__error(message, shouldExit = true) {
		this.__print(message, 'error');
		if (shouldExit) {
			exit(1);
		}
	}

	__success(message = null, shouldExit = true) {
		if (message) {
			this.__print(message, 'success');
		}
		if (shouldExit) {
			exit(0);
		}
	}
}