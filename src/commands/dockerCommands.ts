import AbstractCommand from './abstractCommand';
import { ExecSyncOptions } from 'node:child_process';
import { join } from 'node:path';
import { VolumeInterface } from '@/interfaces/docker';
import { SetupInterface } from '@/interfaces/wordpress';
import { getExternalVolumeFiles, parseVolume } from '@/helpers/docker';
import { getJsonFile } from '@/helpers/fs';
import { confirm } from "@/helpers/cli";
import { deleteVolume, exec, parseComposeFiles } from "@/services/docker";
import { render } from "@/services/template";
import { runSetup } from '@/services/wordpress';

interface DockerPsItem {
	State: string;
	Service: string;
}

export default class DockerCommands extends AbstractCommand {
	public async start({ xdebug } : { xdebug?: boolean }) {
		// Ensure the project is not already running
		try {
			const running = JSON.parse(exec('ps --format json', null, { stdio: 'pipe' }).toString()) as DockerPsItem[];
			if (running.find(service => service.State === 'running')) {
				if (xdebug) {
					process.env.XDEBUG_MODE = 'debug,develop'
					process.env.TEST_XDEBUG_MODE = 'coverage,develop,debug'
					this.exec('up -d --remove-orphans', null, { stdio: 'inherit' });
					this.success('XDebug started.');
				}
				this.error('The project is already running.');
			}
		} catch (error: unknown) {
			// Continue (no running services)
		}

		if  (xdebug) {
			process.env.XDEBUG_MODE = 'debug,develop'
			process.env.TEST_XDEBUG_MODE = 'coverage,develop,debug'
		}

		const config = this.getConfig();

		const [plugins, themes, volumes] = await Promise.all(['plugins', 'themes', 'volumes'].map(async type =>{
			const volumes = (config[type] ?? []) as string[]|VolumeInterface[];
			return getExternalVolumeFiles(volumes, type);
		}));

		config.plugins = plugins;
		config.themes = themes;
		config.volumes = volumes;

		const files = await parseComposeFiles(config);

		this.exec('up -d --build --remove-orphans', files, { stdio: 'inherit' });

		this.success('Project started. Configuring WordPress environments...', false);

		const setupData = {
			...config,
			cliContainer: 'wp-cli',
			exec: this.exec,
		} as SetupInterface;

		try {
			await Promise.all([
				runSetup(setupData),
				runSetup({...setupData, host: `test.${config.host}`, cliContainer: 'wp-test-cli'}),
			]);
		} catch (error: unknown) {
			this.error((error as Error).message);
		}

		this.success(await render('views/docker/start-success', config));
	}

	public async destroy() {
		await confirm('Are you sure you want to destroy the environment?');
		this.exec('down -v', null, { stdio: 'inherit' });
		this.success('Environment destroyed.');
	}

	public async stop({ xdebug } : { xdebug?: boolean }) {
		if (xdebug) {
			process.env.XDEBUG_MODE = 'off';
			process.env.TEST_XDEBUG_MODE = 'coverage';
			this.exec('up -d --remove-orphans', null, { stdio: 'inherit' });
			this.success('XDebug stopped.');
		}

		this.exec('down', null, { stdio: 'inherit' });
		try {
			deleteVolume('wp-test', { stdio: 'pipe' });
		} catch (e) {/* empty */}
		this.success('Environment stopped.');
	}

	public async run(service: string, command: string[], workdir: string|false = false) {
		const services = this.exec('config --services', null, { stdio: 'pipe' }).toString().split('\n');
		const setupFile = getJsonFile(`${process.cwd()}/wp-setup.json`);

		if (!services.includes(service)) {
			this.error(`The service "${service}" does not exist.`);
		}

		if (workdir && setupFile && !workdir.startsWith('/')) {
			const setContainerPath = (volume: VolumeInterface, basePath = '') => ({
				host: volume.host.includes('${PWD}') ? volume.host.replace('${PWD}', process.cwd()) : volume.host,
				container: basePath + volume.container,
			});

			const plugins = (setupFile.plugins ?? []).map(parseVolume)
				.map(volume => setContainerPath(volume, '/var/www/html/wp-content/plugins/'));
			const themes = (setupFile.themes ?? []).map(parseVolume)
				.map(volume => setContainerPath(volume, '/var/www/html/wp-content/themes/'));
			const volumes = (setupFile.themes ?? []).map(parseVolume)
				.map(volume => setContainerPath(volume));
			const directory = join(process.cwd(), workdir);
			workdir = [...plugins, ...themes, ...volumes].find(volume => volume.host === directory)?.container ?? workdir;
		}

		let running = [] as string[];

		try {
			running = (JSON.parse(this.exec('ps --format json', null, { stdio: 'pipe' }).toString()) as DockerPsItem[])
				.filter(service => service.State === 'running')
				.map(service => service.Service);
		} catch (error: unknown) {
			// Continue (no running services)
		}

		const workdirCall = workdir ? `--workdir="${workdir}"` : '';

		try {
			if (running.includes(service)) {
				this.exec(`exec ${workdirCall} ${service} ${command.join(' ')}`, null, { stdio: 'inherit' });
				this.success();
			}
			this.exec(`run --rm ${workdirCall} ${service} ${command.join(' ')}`, null, { stdio: 'inherit' });
			this.success();
		} catch (error: unknown) {
			this.error((error as Error).message);
		}
	}

	async wpCli(command: string[]) {
		command.unshift('wp');
		return this.run('wp-cli', command);
	}

	async wpCliTest(command: string[]) {
		command.unshift('wp');
		return this.run('wp-test-cli', command);
	}

	private exec = (command: string, files: string[]|null = null, options = {} as ExecSyncOptions) => {
		if (options.stdio === undefined) {
			options.stdio = this.mode === 'silent' ? 'pipe' : 'inherit';
		}
		return exec(command, files, options);
	}
}