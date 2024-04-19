import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import VolumeInterface from '@/interfaces/volumeInterface';
import { download, exists, extract, path, rm } from './fs';

let files = [] as string[];

export const getComposeFiles = () => {
	if (files.length) {
		return files;
	}

	const jsonFile = path('build/docker-compose-files.json');
	files = JSON.parse(readFileSync(jsonFile).toString());
	return files;
}

export const parseVolume = (value: string|VolumeInterface): VolumeInterface => {
	if (typeof value !== 'string') {
		return value;
	}

	const parts = value.split(':');
	let [host, container] = parts.length > 2
		? [parts.slice(0, -1).join(':'), parts[parts.length - 1]]
		: parts;

	if (host.startsWith('.') || (!host.startsWith('http') && host.match(/^[a-z0-9]/i))) {
		host = join(process.cwd(), host);
	}

 	return { host, container };
}

export const getExternalVolumeFiles = async (volumes: string[]|VolumeInterface[], type: string): Promise<VolumeInterface[]> => {
	const tmpDir = path(`build/tmp/${type}`);
	const destination = path(`build/${type}`);

	const promises = volumes.map(parseVolume).map(async volume => {
		if (!volume.host.startsWith('http')) {
			return volume;
		}
		
		const url = volume.host;
		const fileName = url.split('/').pop();

		if (!fileName) {
			throw new Error(`Invalid file URL: ${url}`);
		}

		const tmpFile = `${tmpDir}/${fileName}`;
		const dirName = fileName.split('.').shift();
		const dest = `${destination}/${dirName}`;

		if (exists(dest)) {
			return {
				...volume,
				host: dest,
			}
		}

		const file = await download(url, tmpFile);

		await extract(file.path.toString(), destination);
		await rm(tmpFile);

		return {
			...volume,
			host: dest,
		}
	});
	
	return Promise.all(promises);
}