import { pipeline } from 'stream';
import { createWriteStream, createReadStream, mkdirSync, existsSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { get } from 'https';
import { rm as nodeRm } from 'fs/promises';
import unzipper from 'unzipper';

export const path = (path = '') => {
	const __filename = fileURLToPath(import.meta.url);
	const __dirname = dirname(__filename);
	return join(__dirname, '../../', path);
}

export const download = async (url, dest) => {
	const folders = dest.split('/').slice(0, -1);
	createDir(folders.join('/'));

	return new Promise((resolve, reject) => {
		const file = createWriteStream(dest);
		const request = get(url, response => {
			if (response.statusCode !== 200) {
				reject(new Error(`Failed to get ${url}`));
			}

			pipeline(response, file, error => {
				if (error) {
					reject(error);
				}
				resolve(file);
			});
		});

		request.on('error', error => {
			reject(error);
		});
	});
}

export const exists = (path) => {
	return existsSync(path);
}

export const extract = async (file, dest) => {
	return createReadStream(file)
		.pipe(unzipper.Extract({ path: dest }))
		.on('entry', entry => entry.autodrain())
		.promise();
}

export const rm = async (fileOrPath) => {
	return nodeRm(fileOrPath, { recursive: true, force: true });
}

export const createDir = (path) => {
	const folders = path.split('/');
	folders.reduce((acc, folder) => {
		acc += folder + '/';
		if (!existsSync(acc)) {
			mkdirSync(acc);
		}
		return acc;
	}, '');
}

export const getJsonFile = (file) => {
	return JSON.parse(readFileSync(file, 'utf8'));
}