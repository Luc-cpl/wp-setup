import { ExecSyncOptions, execSync } from 'child_process';
import { getComposeFiles } from '@/helpers/docker';
import { getProjectName } from '@/helpers/cli';

export const exec = (command: string, files: string[]|null = null, options: ExecSyncOptions = { stdio: 'inherit' }) => {
	files = files ?? getComposeFiles();
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