import { execSync } from 'child_process';
import { exit } from 'process';
import { ConfigInterface } from '@/interfaces/setup';

export default abstract class AbstractCommand {
	private config = {} as ConfigInterface;
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

	protected getConfig = () => this.config;

	protected print = (message: string, type: 'error'|'warn'|'success'|'info' = 'info') => {
		if (this.mode === 'silent' && type !== 'error' && type !== 'success') {
			return;
		}

		if (this.mode === 'verbose') {
			message = `[${type.toUpperCase()}] ${message}`;
		}

		switch (type) {
			case 'error':
				return console.error(message);
			case 'warn':
				return console.warn(message);
			case 'info':
				return console.info(message);
			default:
				return console.log(message);
		}
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