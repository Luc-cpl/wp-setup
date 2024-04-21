import AbstractCommand from './abstractCommand';
import { ExecSyncOptions } from 'node:child_process';
import { join } from 'node:path';
import { VolumeInterface } from '@/interfaces/docker';
import { ConfigInterface } from '@/interfaces/setup';
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

interface StartCommandOptions extends ConfigInterface {
	plugin?: string[]|VolumeInterface[];
	theme?: string[]|VolumeInterface[];
	volume?: string[]|VolumeInterface[];
}

export default class DockerCommands extends AbstractCommand {
	public async start({plugin = [], theme = [], volume = [], ...options}: StartCommandOptions) {
		// Ensure the project is not already running
		const running = JSON.parse(exec('ps --format json', null, { stdio: 'pipe' }).toString()) as DockerPsItem[];
		if (running.find(service => service.State === 'running')) {
			this.error('The project is already running.');
		}

		options = {...options, ...this.getConfig()};
		options.plugins.concat(plugin);
		options.themes.concat(theme);
		options.volumes.concat(volume);

		const [plugins, themes, volumes] = await Promise.all(['plugins', 'themes', 'volumes'].map(async type =>{
			const volumes = (options[type] ?? []) as string[]|VolumeInterface[];
			return getExternalVolumeFiles(volumes, type);
		}));

		options.plugins = plugins;
		options.themes = themes;
		options.volumes = volumes;

		const files = await parseComposeFiles(options);

		this.exec('up -d --build --remove-orphans', files, { stdio: 'inherit' });

		this.success('Project started. Configuring WordPress environments...', false);

		const setupData = {
			...options,
			cliContainer: 'wp-cli',
			exec: this.exec,
		} as SetupInterface;

		try {
			await Promise.all([
				runSetup(setupData),
				runSetup({...setupData, host: `test.${options.host}`, cliContainer: 'wp-test-cli'}),
			]);
		} catch (error: unknown) {
			this.error((error as Error).message);
		}

		this.success(await render('views/docker/start-success', options));
	}

	public async destroy() {
		await confirm('Are you sure you want to destroy the environment?');
		this.exec('down -v', null, { stdio: 'inherit' });
		this.success('Environment destroyed.');
	}

	public async stop() {
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

		const running = (JSON.parse(this.exec('ps --format json', null, { stdio: 'pipe' }).toString()) as DockerPsItem[])
			.filter(service => service.State === 'running')
			.map(service => service.Service);

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