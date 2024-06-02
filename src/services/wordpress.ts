import { parseVolume } from "@/helpers/docker";
import { VolumeInterface } from "@/interfaces/docker";
import {
	InstallInterface,
	MultisitePluginHandlerInterface,
	PluginHandlerInterface,
	RunSetupInterface
} from "@/interfaces/wordpress";

export const runSetup: RunSetupInterface = async ({cliContainer, host, multisite, plugins, themes, exec}) => {
	plugins = plugins.map(parseVolume);
	themes = themes.map(parseVolume);

	await install(cliContainer, host, multisite, exec);

	const getList = (array: VolumeInterface[]) => array.map(volume => volume.container).join(' ');

	const pluginsList = getList(plugins ?? [])
	const themesList = getList(themes ?? []);
	const promises = [];

	if (pluginsList.length !== 0) {
		promises.push(activatePlugin(cliContainer, pluginsList, exec, Boolean(multisite)));
	}

	if (themesList.length !== 0) {
		promises.push(activateTheme(cliContainer, themesList, exec));
	}

	await Promise.all(promises);
}

export const install: InstallInterface = async (cliContainer, host, multisite, exec) => {
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
			await exec(`exec ${cliContainer} wp core install ${flags.join(' ')}`, { stdio: 'pipe' });
			installed = true;
		} catch (error) {
			if (tryCount > 10) {
				throw new Error('WordPress installation failed.');
			}
			tryCount++;
			await new Promise(resolve => setTimeout(resolve, 1000));
		}
	}

	if (multisite) {
		const type = multisite === true ? 'subdirectory' : multisite;
		const subdomain = type === 'subdomain' ? '--subdomains' : '';
		try {
			await exec(`exec ${cliContainer} wp core multisite-convert ${subdomain}`);
		} catch (e) {/* empty */}
	}

	const uid = process.env.UID ?? 33;
	const gid = process.env.GID ?? 33;

	// Get the current user and group of the wp-content directory
	const output = (await exec(`exec ${cliContainer} ls -ld wp-content`, { stdio: 'pipe' })).toString().trim();
	const parts = output.split(/\s+/);
	const currentUser = parts[2];
	const currentGroup = parts[3];

	// Ensure we can write to the wp-content directory
	if (currentUser !== uid || currentGroup !== gid) {
		await exec(`run --rm --user root ${cliContainer} chown ${uid}:${gid} wp-content`);
	}
}

export const deletePlugin: PluginHandlerInterface = async (cliContainer, plugin, exec) => {
	const pluginList = Array.isArray(plugin) ? plugin : [plugin];
	try {
		await exec(`exec ${cliContainer} wp plugin delete ${pluginList.join(' ')}`);
		return true;
	} catch (e) {
		return false;
	}
}

export const deleteTheme: PluginHandlerInterface = async (cliContainer, theme, exec) => {
	const themeList = Array.isArray(theme) ? theme : [theme];
	try {
		await exec(`exec ${cliContainer} wp theme delete ${themeList.join(' ')}`);
		return true;
	} catch (e) {
		return false;
	}
}

export const installPlugin: PluginHandlerInterface = async (cliContainer, plugin, exec) => {
	const pluginList = Array.isArray(plugin) ? plugin : [plugin];
	try {
		await exec(`exec ${cliContainer} wp plugin install ${pluginList.join(' ')}`);
		return true;
	} catch (e) {
		return false;
	}
}

export const installTheme: PluginHandlerInterface = async (cliContainer, theme, exec) => {
	const themeList = Array.isArray(theme) ? theme : [theme];
	try {
		await exec(`exec ${cliContainer} wp theme install ${themeList.join(' ')}`);
		return true;
	} catch (e) {
		return false;
	}
}

export const activatePlugin: MultisitePluginHandlerInterface = async (cliContainer, plugin, exec, multisite) => {
	const pluginList = Array.isArray(plugin) ? plugin : [plugin];
	const multisiteFlag = multisite ? '--network' : '';
	try {
		await exec(`exec ${cliContainer} wp plugin activate ${multisiteFlag} ${pluginList.join(' ')}`);
		return true;
	} catch (e) {
		return false;
	}
}

export const activateTheme: PluginHandlerInterface = async (cliContainer, theme, exec) => {
	const themeList = Array.isArray(theme) ? theme : [theme];
	try {
		await exec(`exec ${cliContainer} wp theme activate ${themeList.join(' ')}`);
		return true;
	} catch (e) {
		return false;
	}
}