import { execSync } from 'child_process';
import { getComposeFiles } from '../helpers/docker.mjs';
import { getProjectName } from '../helpers/cli.mjs';

export const exec = (command, files = null, options = { stdio: 'inherit' }) => {
	files = files ?? getComposeFiles();
	const projectName = getProjectName();
	const dockerCommand = `docker compose -p ${projectName} ${files.map(f => `-f ${f}`).join(' ')} ${command}`;

	try {
		return execSync(dockerCommand, options);
	} catch (error) {
		error.message = error.message.replace(`Command failed: ${dockerCommand}`, '');
		throw error;
	}
}

export const deleteVolume = (volume, options = { stdio: 'inherit' }) => {
	const projectName = getProjectName();
	const volumeName = `${projectName}_${volume}`;
	
	try {
		return execSync(`docker volume rm ${volumeName}`, options);
	} catch (error) {
		error.message = error.message.replace(`Command failed: docker volume rm ${volumeName}`, '');
		throw error;
	}
}