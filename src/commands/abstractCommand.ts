import { execSync } from 'child_process';
import { exit } from 'process';
import { ConfigInterface } from '@/interfaces/setup';
import { VolumeInterface } from '@/interfaces/docker';
import { getExternalVolumeFiles } from '@/helpers/docker';

export default abstract class AbstractCommand {
	private config = {} as ConfigInterface;
	private parsedConfig = false;
	protected mode = 'silent' as 'silent'|'verbose';

	public constructor(config: ConfigInterface) {
		this.config = config;
		this.setUser();
	}

	private setUser = () => {
		if (process.env.UID && process.env.GID) {
			return;
		}

		const uid = execSync('id -u', { stdio: 'pipe' }).toString().trim();
		const gid = execSync('id -g', { stdio: 'pipe' }).toString().trim();
		process.env.UID = uid;
		process.env.GID = gid;
	}

	protected getConfig = async () => {
		if (this.parsedConfig) {
			return this.config;
		}

		const [plugins, themes, volumes] = await Promise.all(['plugins', 'themes', 'volumes'].map(async type =>{
			const volumes = (this.config[type] ?? []) as string[]|VolumeInterface[];
			const singularType = type.slice(0, -1);
			const beforeCallback = (fileName: string, tmpFile: string) => {
				this.info(`Downloading ${singularType}: ${fileName} on ${tmpFile}...`);
			}
			return getExternalVolumeFiles(volumes, type, beforeCallback);
		}));

		this.config.plugins = plugins;
		this.config.themes = themes;
		this.config.volumes = volumes;

		this.parsedConfig = true;
		return this.config;
	}

	protected print = (message: string, type: 'error'|'warn'|'success'|'info'|'log' = 'log') => {
				switch (type) {
			case 'error':
				return console.log('\x1b[31m%s\x1b[0m', message);
			case 'warn':
				return console.log('\x1b[33m%s\x1b[0m', message);
			case 'info':
				return console.log('\x1b[34m%s\x1b[0m', message);
			case 'success':
				return console.log('\x1b[32m%s\x1b[0m', message);
			default:
				return console.log(message);
		}
	}

	protected log = (message: string) => {
		this.print(message);
	}

	protected info = (message: string) => {
		this.print(message, 'info');
	}

	protected error = (message: string, shouldExit = true) => {
		this.print(message, 'error');
		if (shouldExit) {
			exit(1);
		}
	}

	protected success = (message: string|null = null, shouldExit = true) => {
		if (message) {
			this.print(message, 'success');
		}
		if (shouldExit) {
			exit(0);
		}
	}
}