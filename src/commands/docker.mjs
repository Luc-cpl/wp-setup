import { execSync } from 'child_process';
import { exit } from 'process';
import { confirm } from "../helpers/cli.mjs";
import { render, save } from '../services/template.mjs';
import { exec } from "../services/docker.mjs";
import { getExternalVolumeFiles, parseVolume } from '../helpers/docker.mjs';
import { getJsonFile } from '../helpers/fs.mjs';
import { join } from 'path';

const setupWP = async ({cliContainer, host, multisite, plugin, theme}) => {
	let installed = false;
	while (!installed) {
		try {
			const flags = [
				'--url=' + host,
				'--title="' + process.cwd().split('/').pop() + '"',
				'--admin_user=admin',
				'--admin_password=password',
				'--admin_email=admin@email.com',
			];
			exec(`exec ${cliContainer} wp core install ${flags.join(' ')}`, null, { stdio: 'pipe' });
			installed = true;
		} catch (error) {
			await new Promise(resolve => setTimeout(resolve, 1000));
		}
	}

	if (multisite) {
		const type = multisite === true ? 'subdirectory' : multisite;
		const subdomain = type === 'subdomain' ? '--subdomains' : '';
		try {
			exec(`exec ${cliContainer} wp core multisite-convert ${subdomain}`);
		} catch (e) {}
	}

	const uid = process.env.UID ?? 33;
	const gid = process.env.GID ?? 33;

	// Ensure we can write to the wp-content directory
	exec(`run --rm --user root ${cliContainer} chown ${uid}:${gid} wp-content`, null, { stdio: 'pipe' });

	try {
		exec(`exec ${cliContainer} wp theme install twentytwentyfour`, null, { stdio: 'pipe' });
		exec(`exec ${cliContainer} wp plugin delete hello akismet`, null, { stdio: 'pipe' });
		exec(`exec ${cliContainer} wp theme delete twentytwentythree twentytwentytwo`, null, { stdio: 'pipe' });
	} catch (e) {}

	const plugins = plugin ?? [];
	plugins.forEach(plugin => {
		const multisiteFlag = multisite ? '--network' : '';
		exec(`exec ${cliContainer} wp plugin activate ${plugin.container} ${multisiteFlag}`);
	});

	const themes = theme ?? [];
	themes.forEach(theme => {
		exec(`exec ${cliContainer} wp theme activate ${theme.container}`);
	});
}

export const start = async (options) => {
	const setupFile = getJsonFile(`${process.cwd()}/wp-setup.json`);
	options = {...options, ...setupFile};

	['plugins', 'themes', 'volumes'].forEach(plural => {
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

	const uid = execSync('id -u', { stdio: 'pipe' }).toString().trim();
	const gid = execSync('id -g', { stdio: 'pipe' }).toString().trim();

	// Set the env vars for the user id and group id
	process.env.UID = uid;
	process.env.GID = gid;

    exec(`up -d --build --remove-orphans`, files, { stdio: 'inherit' });

	console.log(`Project started. Waiting for services to be ready...`);

	await Promise.all([
		setupWP({...options, cliContainer: 'wp-cli'}),
		setupWP({...options, host: `test.${options.host}`, cliContainer: 'wp-test-cli'}),
	]);

	console.log('');
	console.log('============================================================');
	console.log('All ready! Enjoy your WordPress development environment.');
	console.log(`- Site: https://${options.host}`);
	console.log(`- Test Site: https://test.${options.host}`);
	console.log(`- User: admin`);
	console.log(`- Password: password`);
	console.log('============================================================');
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

export const run = async (service, command, { workdir }) => {
	const services = exec('config --services', null, { stdio: 'pipe' }).toString().split('\n');
	const setupFile = getJsonFile(`${process.cwd()}/wp-setup.json`);

	if (!services.includes(service)) {
		console.error(`The service "${service}" does not exist.`);
		exit(1);
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

	const running = JSON.parse(exec('ps --format json', null, { stdio: 'pipe' }).toString())
		.filter(service => service.State === 'running')
		.map(service => service.Service);

	const workdirCall = workdir ? `--workdir="${workdir}"` : '';

	try {
		if (running.includes(service)) {
			exec(`exec ${workdirCall} ${service} ${command.join(' ')}`);
			exit(0);
		}
		exec(`run --rm ${workdirCall} ${service} ${command.join(' ')}`);
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

export const wpCliTest = async (command) => {
	command.unshift('wp');
	return run('wp-test-cli', command);
}