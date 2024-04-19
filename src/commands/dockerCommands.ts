import AbstractCommand from './abstractCommand';
import { join } from 'node:path';
import { confirm } from "@/helpers/cli";
import { getExternalVolumeFiles, parseVolume } from '@/helpers/docker';
import { getJsonFile } from '@/helpers/fs';
import { render, renderAndSave, save } from "@/services/template";
import { deleteVolume, exec } from "@/services/docker";
import VolumeInterface from '@/interfaces/volumeInterface';
import ConfigInterface from '@/interfaces/configInterface';

interface DockerPsItem {
	State: string;
	Service: string;
}

interface DockerWPSetup {
	cliContainer: string;
	host: string;
	multisite: boolean|string;
	plugins: VolumeInterface[];
	themes: VolumeInterface[];
}

export default class DockerCommands extends AbstractCommand {
	public async start({plugin = [], theme = [], volume = [], ...options}) {
		// Ensure the project is not already running
		const running = JSON.parse(exec('ps --format json', null, { stdio: 'pipe' }).toString()) as DockerPsItem[];
		if (running.find(service => service.State === 'running')) {
			this.error('The project is already running.');
		}

		options = {...options, ...this.getConfig()}

		options.plugins = [...options.plugins, ...plugin];
		options.themes = [...options.themes, ...theme];
		options.volumes = [...options.volumes, ...volume];

		const files = await this.parseComposeFiles(options as ConfigInterface);
		save('docker-compose-files.json', JSON.stringify(files));

		this.exec(`up -d --build --remove-orphans`, files, { stdio: 'inherit' });

		this.print(`Project started. Configuring WordPress environments...`);

		await Promise.all([
			this.setupWP({...options, cliContainer: 'wp-cli'} as DockerWPSetup),
			this.setupWP({...options, host: `test.${options.host}`, cliContainer: 'wp-test-cli'} as DockerWPSetup),
		]);

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
		} catch (e) {}
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
		} catch (error: any) {
			this.error(error.message);
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

	private exec(command: string, files: string[]|null = null, options = {} as any) {
		if (options.stdio === undefined) {
			options.stdio = this.mode === 'silent' ? 'pipe' : 'inherit';
		}
		return exec(command, files, options);
	}

	private async setupWP({cliContainer, host, multisite, plugins, themes}: DockerWPSetup) {
		let installed = false;
		let tryCount = 0;
		while (!installed) {
			try {
				const flags = [
					'--url=' + host,
					'--title="' + process.cwd().split('/').pop() + '"',
					'--admin_user=admin',
					'--admin_password=password',
					'--admin_email=admin@email.com',
				];
				this.exec(`exec ${cliContainer} wp core install ${flags.join(' ')}`, null, { stdio: 'pipe' });
				installed = true;
			} catch (error) {
				if (tryCount > 10) {
					this.error('WordPress installation failed.');
				}
				tryCount++;
				await new Promise(resolve => setTimeout(resolve, 1000));
			}
		}
	
		if (multisite) {
			const type = multisite === true ? 'subdirectory' : multisite;
			const subdomain = type === 'subdomain' ? '--subdomains' : '';
			try {
				this.exec(`exec ${cliContainer} wp core multisite-convert ${subdomain}`);
			} catch (e) {}
		}
	
		const uid = process.env.UID ?? 33;
		const gid = process.env.GID ?? 33;
	
		// Get the current user and group of the wp-content directory
		const output = this.exec(`exec ${cliContainer} ls -ld wp-content`, null, { stdio: 'pipe' }).toString().trim();
		const parts = output.split(/\s+/);
		const currentUser = parts[2];
		const currentGroup = parts[3];
	
		// Ensure we can write to the wp-content directory
		if (currentUser !== uid || currentGroup !== gid) {
			this.exec(`run --rm --user root ${cliContainer} chown ${uid}:${gid} wp-content`);
		}
	
		const tryExecAsync = async (command: string) => {
			try {
				this.exec(command);
			} catch (e) {}
		}
	
		await Promise.all([
			tryExecAsync(`exec ${cliContainer} wp theme install twentytwentyfour`),
			tryExecAsync(`exec ${cliContainer} wp plugin delete hello akismet`),
			tryExecAsync(`exec ${cliContainer} wp theme delete twentytwentythree twentytwentytwo`),
		]);
	
		const getList = (array: VolumeInterface[]) => array.map(volume => volume.container).join(' ');
	
		const pluginsList = getList(plugins ?? [])
		const themesList = getList(themes ?? []);
		const multisiteFlag = multisite ? '--network' : '';
	
		const maybeExec = async (command: string, condition: boolean) => {
			if (!condition) {
				return;
			}
			try {
				return this.exec(command, null, { stdio: 'pipe' });
			} catch (e: any) {
				return e.message;
			}
		}
	
		await Promise.all([
			maybeExec(`exec ${cliContainer} wp plugin activate ${pluginsList} ${multisiteFlag}`, pluginsList.length !== 0),
			maybeExec(`exec ${cliContainer} wp theme activate ${themesList}`, themesList.length !== 0),
		]);
	}

	private async parseComposeFiles(config: ConfigInterface): Promise<string[]> {
		const volumes = await Promise.all(['plugins', 'themes', 'volumes'].map(async type =>{
			const volumes = (config[type as keyof ConfigInterface] ?? []) as string[]|VolumeInterface[];
			return getExternalVolumeFiles(volumes, type);
		}));

		config.plugins = volumes[0];
		config.themes = volumes[1];
		config.volumes = volumes[2];

		const file = await renderAndSave('docker-compose.yml', 'docker-compose.yml', config);
		const files = [file];

		if (config.include) {
			files.push(config.include);
		}

		return files;
	}
}