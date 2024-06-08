import { ExecSyncOptions, execSync } from 'child_process';
import { getProjectName } from '@/helpers/cli';

import { ComposeExecInterface, DockerExecInterface, DockerPsItem } from '@/interfaces/docker';
import { ConfigInterface } from '@/interfaces/setup';
import { renderAndSave } from './template';

export const exec: ComposeExecInterface = async (config, command, options = { stdio: 'inherit' }) => {
	const files = await parseComposeFiles(config)
	const projectName = getProjectName();
	const dockerCommand = `docker compose -p ${projectName} ${files.map(f => `-f ${f}`).join(' ')} ${command}`;

	try {
		return execSync(dockerCommand, options);
	} catch (e) {
		const error = e as Error;
		error.message = error.message.replace(`Command failed: ${dockerCommand}`, '');
		throw error;
	}
}

export const docker: DockerExecInterface = async (command, options = { stdio: 'inherit' }) => {
	const dockerCommand = `docker ${command}`;
	try {
		return execSync(dockerCommand, options);
	} catch (e) {
		const error = e as Error;
		error.message = error.message.replace(`Command failed: ${dockerCommand}`, '');
		throw error;
	}
}

export const deleteVolume = (volume: string, options: ExecSyncOptions = { stdio: 'inherit' }) => {
	const projectName = getProjectName();
	const volumeName = `${projectName}_${volume}`;

	try {
		return execSync(`docker volume rm ${volumeName}`, options);
	} catch (e) {
		const error = e as Error;
		error.message = error.message.replace(`Command failed: docker volume rm ${volumeName}`, '');
		throw error;
	}
}

export const parseComposeFiles = async (config: ConfigInterface): Promise<string[]> => {
	const file = await renderAndSave('docker-compose.yml', 'docker-compose.yml', config);
	const files = [file];

	if (config.include) {
		files.push(config.include);
	}

	return files;
}

export const getServices = async (config: ConfigInterface) => {
	try {
		let jsonStr = (await exec(config, 'ps --format json', { stdio: 'pipe' })).toString();
		/**
		 * In older versions of Docker, the output will be correctly formatted as JSON,
		 * since docker compose 2.21, the output an invalid JSON string.
		 */
		jsonStr = jsonStr.replace(/}\s*{/g, '},{');
		jsonStr = jsonStr.startsWith('[') ? jsonStr : `[${jsonStr}]`;

		const services = JSON.parse(jsonStr) as DockerPsItem[];
		return await Promise.all(services.map(async service => {
			let image = (await docker(`inspect ${service.ID} --format '{{.Config.Image}}'`, { stdio: 'pipe' })).toString();
			service.Image = image.replace(/\s/g, '');
			return service;
		}));
	} catch (error: unknown) {
		return [];
	}
}
