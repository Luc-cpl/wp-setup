import AbstractCommand from './abstractCommand';
import { ExecSyncOptions } from 'node:child_process';
import { join } from 'node:path';
import { VolumeInterface } from '@/interfaces/docker';
import { SetupInterface } from '@/interfaces/wordpress';
import { parseVolume } from '@/helpers/docker';
import { getJsonFile } from '@/helpers/fs';
import { confirm } from "@/helpers/cli";
import { deleteVolume, exec, getServices } from "@/services/docker";
import { render } from "@/services/template";
import { runSetup } from '@/services/wordpress';

export default class DockerCommands extends AbstractCommand {
	public async start({ xdebug } : { xdebug?: boolean }) {
		const config = await this.getConfig();
		const running = await getServices(config);
		if (running.find(service => service.State === 'running')) {
			if (xdebug) {
				process.env.XDEBUG_MODE = 'debug,develop'
				process.env.TEST_XDEBUG_MODE = 'coverage,develop,debug'
				await this.exec('up -d --remove-orphans', { stdio: 'inherit' });
				this.success('XDebug started.');
			}
			this.error('The project is already running.');
		}

		if  (xdebug) {
			process.env.XDEBUG_MODE = 'debug,develop'
			process.env.TEST_XDEBUG_MODE = 'coverage,develop,debug'
		}

		await this.exec('up -d --build --remove-orphans', { stdio: 'inherit' });

		this.log('Project started. Configuring WordPress environments...');

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

		this.log(await render('views/docker/start-success', config));
		this.success('Environment started.');
	}

	public async destroy() {
		await confirm('Are you sure you want to destroy the environment?');
		await this.exec('down -v', { stdio: 'inherit' });
		this.success('Environment destroyed.');
	}

	public async stop({ xdebug } : { xdebug?: boolean }) {
		if (xdebug) {
			process.env.XDEBUG_MODE = 'off';
			process.env.TEST_XDEBUG_MODE = 'coverage';
			await this.exec('up -d --remove-orphans', { stdio: 'inherit' });
			this.success('XDebug stopped.');
		}

		await this.exec('down', { stdio: 'inherit' });
		try {
			deleteVolume('wp-test', { stdio: 'pipe' });
		} catch (e) {/* empty */}
		this.success('Environment stopped.');
	}

	public async run(service: string, command: string[], workdir: string|false = false) {
		const services = (await this.exec('config --services', { stdio: 'pipe' })).toString().split('\n');
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

		const config = await this.getConfig();
		const running = (await getServices(config))
			.filter(service => service.State === 'running')
			.map(service => service.Service);

		const workdirCall = workdir ? `--workdir="${workdir}"` : '';

		try {
			if (running.includes(service)) {
				await this.exec(`exec ${workdirCall} ${service} ${command.join(' ')}`, { stdio: 'inherit' });
				this.success();
			}
			await this.exec(`run --rm ${workdirCall} ${service} ${command.join(' ')}`, { stdio: 'inherit' });
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

	private exec = async (command: string, options = {} as ExecSyncOptions) => {
		const config = await this.getConfig();
		if (options.stdio === undefined) {
			options.stdio = this.mode === 'silent' ? 'pipe' : 'inherit';
		}
		return await exec(config, command, options);
	}
}