import { pipeline } from 'stream';
import { createWriteStream, mkdirSync, existsSync, readFileSync, WriteStream } from 'node:fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { get } from 'https';
import { rm as nodeRm } from 'fs/promises';
import { ConfigInterface } from '@/interfaces/setup';
import AdmZip from 'adm-zip';

export const path = (path = '') => {
	const __filename = fileURLToPath(import.meta.url);
	const __dirname = dirname(__filename);
	return join(__dirname, '../../', path);
}

export const download = async (url: string, dest: string): Promise<WriteStream> => {
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

export const exists = (path: string) => {
	return existsSync(path);
}

export const extract = async (file: string, dest: string): Promise<void> => {
	const zip = new AdmZip(file);
	zip.extractAllTo(dest);
}

export const rm = async (fileOrPath: string) => {
	return nodeRm(fileOrPath, { recursive: true, force: true });
}

export const createDir = (path: string) => {
	const folders = path.split('/');
	folders.reduce((acc, folder) => {
		acc += folder + '/';
		if (!existsSync(acc)) {
			mkdirSync(acc);
		}
		return acc;
	}, '');
}

export const getJsonFile = (file: string): ConfigInterface|null => {
	try {
		return JSON.parse(readFileSync(file, 'utf8'));
	} catch (error) {
		return null;
	}
}