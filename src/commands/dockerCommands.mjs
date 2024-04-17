import AbstractCommand from './abstractCommand.mjs';
import { join } from 'path';
import { confirm } from "../helpers/cli.mjs";
import { getExternalVolumeFiles, parseVolume } from '../helpers/docker.mjs';
import { getJsonFile } from '../helpers/fs.mjs';
import { render, renderAndSave, save } from "../services/template.mjs";
import { deleteVolume, exec } from "../services/docker.mjs";

export default class DockerCommands extends AbstractCommand {

	async start({plugin = [], theme = [], volume = [], ...options}) {
		// Ensure the project is not already running
		const running = JSON.parse(exec('ps --format json', null, { stdio: 'pipe' }).toString());
		if (running.find(service => service.State === 'running')) {
			this.__error('The project is already running.');
		}

		options = {...options, ...this.__getConfig()};

		options.plugins = [...options.plugins, ...plugin];
		options.themes = [...options.themes, ...theme];
		options.volumes = [...options.volumes, ...volume];

		const files = await this.#parseComposeFiles(options);
		save('docker-compose-files.json', JSON.stringify(files));

		this.exec(`up -d --build --remove-orphans`, files, { stdio: 'inherit' });

		this.__print(`Project started. Configuring WordPress environments...`);

		await Promise.all([
			this.#setupWP({...options, cliContainer: 'wp-cli'}),
			this.#setupWP({...options, host: `test.${options.host}`, cliContainer: 'wp-test-cli'}),
		]);

		this.__success(await render('views/docker/start-success', options));
	}

	async destroy() {
		await confirm('Are you sure you want to destroy the environment?');
		this.exec('down -v', null, { stdio: 'inherit' });
		this.__success('Environment destroyed.');
	}
	
	async stop() {
		this.exec('down', null, { stdio: 'inherit' });
		try {
			this.deleteVolume('wp-test');
		} catch (e) {}
		this.__success('Environment stopped.');
	}

	exec(command, files = null, options = {}) {
		if (options.stdio === undefined) {
			options.stdio = this.mode === 'silent' ? 'pipe' : 'inherit';
		}
		return exec(command, files, options);
	}

	deleteVolume(volume) {
		return deleteVolume(volume, { stdio: 'pipe' });
	}
	
	async run(service, command, workdir) {
		const services = this.exec('config --services', null, { stdio: 'pipe' }).toString().split('\n');
		const setupFile = getJsonFile(`${process.cwd()}/wp-setup.json`);
	
		if (!services.includes(service)) {
			this.__error(`The service "${service}" does not exist.`);
		}
	
		if (workdir && setupFile && !workdir.startsWith('/')) {
			const setContainerPath = (volume, basePath = '') => ({
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
	
		const running = JSON.parse(this.exec('ps --format json', null, { stdio: 'pipe' }).toString())
			.filter(service => service.State === 'running')
			.map(service => service.Service);
	
		const workdirCall = workdir ? `--workdir="${workdir}"` : '';
	
		try {
			if (running.includes(service)) {
				this.exec(`exec ${workdirCall} ${service} ${command.join(' ')}`, null, { stdio: 'inherit' });
				this.__success();
			}
			this.exec(`run --rm ${workdirCall} ${service} ${command.join(' ')}`, null, { stdio: 'inherit' });
			this.__success();
		} catch (error) {
			this.__error(error.message);
		}
	}
	
	async wpCli(command) {
		command.unshift('wp');
		return run('wp-cli', command);
	}
	
	async wpCliTest(command) {
		command.unshift('wp');
		return run('wp-test-cli', command);
	}

	async #setupWP({cliContainer, host, multisite, plugins, themes}) {
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
					this.__error('WordPress installation failed.');
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
	
		const tryExecAsync = async (command) => {
			try {
				this.exec(command);
			} catch (e) {}
		}
	
		await Promise.all([
			tryExecAsync(`exec ${cliContainer} wp theme install twentytwentyfour`),
			tryExecAsync(`exec ${cliContainer} wp plugin delete hello akismet`),
			tryExecAsync(`exec ${cliContainer} wp theme delete twentytwentythree twentytwentytwo`),
		]);
	
		const getList = (array) => array.map(volume => volume.container).join(' ');
	
		const pluginsList = getList(plugins ?? [])
		const themesList = getList(themes ?? []);
		const multisiteFlag = multisite ? '--network' : '';
	
		const maybeExec = async (command, condition) => {
			if (!condition) {
				return;
			}
			try {
				return this.exec(command, null, { stdio: 'pipe' });
			} catch (e) {
				return e.message;
			}
		}
	
		await Promise.all([
			maybeExec(`exec ${cliContainer} wp plugin activate ${pluginsList} ${multisiteFlag}`, pluginsList.length !== 0),
			maybeExec(`exec ${cliContainer} wp theme activate ${themesList}`, themesList.length !== 0),
		]);
	}

	async #parseComposeFiles(config) {
		const volumes = await Promise.all(['plugins', 'themes', 'volumes'].map(async type =>{
			return getExternalVolumeFiles(config[type] ?? [], type);
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