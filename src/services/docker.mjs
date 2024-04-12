import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { path } from '../helpers/fs.mjs';

let files = [];

const getComposeFiles = () => {
	if (files.length) {
		return files;
	}

	const jsonFile = path('build/docker-compose-files.json');
	files = JSON.parse(readFileSync(jsonFile));
	return files;
}

export const getProjectName = () => {
	return process.cwd().split('/').pop().toLowerCase().replace(/[^a-z0-9]/gi, '-');
}

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