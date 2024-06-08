import { ConfigInterface } from '@/interfaces/setup';
import { join } from 'path';
import { save } from './template';
import { exec } from 'node:child_process';
import { DockerPsItem } from '@/interfaces/docker';

const containerIdToHex = (containerId: string) => {
	let hexString = '';
	for (let i = 0; i < containerId.length; i++) {
		hexString += containerId.charCodeAt(i).toString(16).padStart(2, '0');
	}
	return hexString;
}

export const getVSCodeConfig = (config: ConfigInterface) => {
	config.editorConfig = {
		...config.editorConfig ?? {},
		vscode: {
			...config.editorConfig?.vscode ?? {},
			extensions: [
				...config.editorConfig?.vscode?.extensions ?? [],
				'xdebug.php-debug',
			],
			remoteEnv: {
				...config.editorConfig?.vscode?.remoteEnv ?? {},
				'XDEBUG_CLIENT_HOST': 'localhost'
			},
		},
	};

	return config.editorConfig.vscode;
}

export const startVSCode = (config: ConfigInterface, service: DockerPsItem, workdir: string) => {
	const vsConfig = { ...config.editorConfig.vscode, workspaceFolder: workdir };
	const userHome = process.env.HOME ?? process.env.USERPROFILE ?? '';
	const platform = process.platform;
	const baseSettingsDir = platform === 'win32'
		? join(userHome, 'AppData', 'Roaming')
		: platform === 'darwin'
			? join(userHome, 'Library', 'Application Support')
			: join(userHome, '.config');

	const settingsBaseDir = join(
		baseSettingsDir,
		'Code', 'User', 'globalStorage', 'ms-vscode-remote.remote-containers',
	);

	const settingFileName = service.Name + ".json";
	save(join(settingsBaseDir, 'nameConfigs', settingFileName), JSON.stringify(vsConfig, null, 2), true);
	const containerHex = containerIdToHex(service.ID);
	const command = `code --sync=on --folder-uri=vscode-remote://attached-container+${containerHex}${workdir ? workdir : '/var/www/html'}`;
	exec(command);
}