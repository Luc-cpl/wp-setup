import { execSync } from 'child_process';
import { getComposeFiles, getProjectName } from '../helpers/docker.mjs';

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