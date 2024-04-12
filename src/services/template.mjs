import { Edge } from 'edge.js'
import { existsSync, mkdirSync, writeFileSync } from 'fs';

import { createDir, path } from '../helpers/fs.mjs';

export const render = async (template, options) => {
	const edge = Edge.create();
	edge.mount(path('templates'));
	options.root = path();
	return edge.render(template, options);
}

export const save = async (file, content) => {
	file = path('build/' + file);

	const folders = file.split('/').slice(0, -1);
	createDir(folders.join('/'));

	writeFileSync(file, content);

	return file;
}