import { exit } from 'process';
import { readFileSync } from 'fs';
import { confirm } from "../helpers/cli.mjs";
import { render, save } from '../services/template.mjs';
import { exec, getProjectName } from "../services/docker.mjs";
import { parseVolume } from '../helpers/docker.mjs';
import { download, path, rm } from '../helpers/fs.mjs';

const getExternalVolumeFiles = async (volumes, type) => {
	const tmpDir = path('build/tmp');
	const destination = path(`build/${type}s`);

	const promises = volumes.map(async volume => {
		if (!volume.host.startsWith('http')) {
			return volume;
		}
		
		const url = volume.host;
		const fileName = url.split('/').pop();
		const tmpFile = `${tmpDir}/${fileName}`;
		const file = await download(url, tmpFile);

		rm(tmpFile);
	});
	
	return Promise.all(promises);
}

export const start = async (options) => {
	const setup = JSON.parse(readFileSync(`${process.cwd()}/wp-setup.json`, 'utf8'));
	options = {...setup, ...options};

	const pluralizedSetup = ['plugins', 'themes', 'volumes'];

	pluralizedSetup.forEach(plural => {
		if (options[plural] && Array.isArray(options[plural])) {
			const singular = plural.slice(0, -1);
			options[singular] = [
				...options[singular] ?? [],
				...options[plural].map(parseVolume),
			];
			delete options[plural];
		}
	});

	const volumes = await Promise.all(['plugin', 'theme', 'volume'].map(async type =>{
		return getExternalVolumeFiles(options[type] ?? [], type);
	}));

	options.plugin = volumes[0];
	options.theme = volumes[1];
	options.volume = volumes[2];

    const content = await render('docker-compose.yml', options);
    const file = await save('docker-compose.yml', content);

    const files = [file];

    if (options.include) {
        files.push(options.include);
    }

    save('docker-compose-files.json', JSON.stringify(files));

    exec(`up -d --build --remove-orphans`, files, { stdio: 'inherit' });

	console.log(`Project started. Waiting for services to be ready...`);

	let installed = false;
	while (!installed) {
		try {
			const flags = [
				'--url=' + options.host,
				'--title=' + getProjectName(),
				'--admin_user=admin',
				'--admin_password=password',
				'--admin_email=admin@email.com',
			];
			exec(`exec wp-cli wp core install ${flags.join(' ')}`);
			installed = true;
		} catch (error) {
			await new Promise(resolve => setTimeout(resolve, 1000));
		}
	}

	if (options.multisite) {
		const type = options.multisite === true ? 'subdirectory' : options.multisite;
		const subdomain = type === 'subdomain' ? '--subdomains' : '';
		exec(`exec wp-cli wp core multisite-convert ${subdomain}`);
	}

	const plugins = options.plugin ?? [];
	plugins.forEach(plugin => {
		exec(`exec wp-cli wp plugin activate ${plugin.container}`);
	});

	const themes = options.theme ?? [];
	themes.forEach(theme => {
		exec(`exec wp-cli wp theme activate ${theme.container}`);
	});

	console.log('-----------------------------------------------------------');
	console.log('All ready! Enjoy your WordPress development environment.');
	console.log(`- Site: http://${options.host}`);
	console.log(`- User: admin`);
	console.log(`- Password: password`);
	console.log('-----------------------------------------------------------');
    exit(0);
}

export const destroy = async () => {
	await confirm('Are you sure you want to destroy the environment?');
    exec('down -v');
	exit(0);
}

export const stop = async () => {
    exec('down');
	exit(0);
}

export const run = async (service, command) => {
	const services = exec('config --services', null, { stdio: 'pipe' }).toString().split('\n');

	if (!services.includes(service)) {
		console.error(`The service "${service}" does not exist.`);
		exit(1);
	}

	const running = JSON.parse(exec('ps --format json', null, { stdio: 'pipe' }).toString())
		.filter(service => service.State === 'running')
		.map(service => service.Service);

	try {
		if (running.includes(service)) {
			exec(`exec ${service} ${command.join(' ')}`);
			exit(0);
		}
		exec(`run --rm ${service} ${command.join(' ')}`);
		exit(0);
	} catch (error) {
		console.error(error.message);
		exit(1);
	}
}

export const wpCli = async (command) => {
	command.unshift('wp');
	return run('wp-cli', command);
}