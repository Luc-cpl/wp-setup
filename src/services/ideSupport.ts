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
				'felixfbecker.php-debug',
			],
			'terminal.integrated.env.linux': {
				...config.editorConfig?.vscode?.['terminal.integrated.env.linux'] ?? {},
				'XDEBUG_CLIENT_HOST': 'localhost'
			},
			'terminal.integrated.env.osx': {
				...config.editorConfig?.vscode?.['terminal.integrated.env.osx'] ?? {},
				'XDEBUG_CLIENT_HOST': 'localhost'
			},
			'terminal.integrated.env.windows': {
				...config.editorConfig?.vscode?.['terminal.integrated.env.windows'] ?? {},
				'XDEBUG_CLIENT_HOST': 'localhost'
			},
		},
	};

	return config.editorConfig.vscode;
}

export const startVSCode = (config: ConfigInterface, service: DockerPsItem, workdir: string) => {
	const vsConfig = config.editorConfig.vscode;
	const userHome = process.env.HOME ?? process.env.USERPROFILE ?? '';
	const platform = process.platform;
	const baseSettingsDir = platform === 'win32'
		? join(userHome, 'AppData', 'Roaming')
		: platform === 'darwin'
			? join(userHome, 'Library', 'Application Support')
			: join(userHome, '.config');

	const settingFileName = encodeURIComponent(service.Image) + '.json';
	const settingsDir = join(
		baseSettingsDir,
		'Code', 'User', 'globalStorage', 'ms-vscode-remote.remote-containers', 'imageConfigs',
		settingFileName
	);

	save(settingsDir, JSON.stringify(vsConfig, null, 2), true);
	const containerHex = containerIdToHex(service.ID);
	const command = `code --folder-uri=vscode-remote://attached-container+${containerHex}${workdir ? workdir : '/var/www/html'}`;
	exec(command);
}