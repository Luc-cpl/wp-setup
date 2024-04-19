import { Edge } from 'edge.js'
import { writeFileSync } from 'fs';

import { createDir, path } from '@/helpers/fs';

export const render = async (template: string, options: Record<string, any> = {}) => {
	const edge = Edge.create();
	edge.mount(path('templates'));
	options.root = path();
	return edge.render(template, options);
}

export const renderAndSave = async (template: string, file: string, options: Record<string, any> = {}, project = false) => {
	const content = await render(template, options);
	return await save(file, content, project);
}

export const save = async (file: string, content: string, project = false) => {
	file = !project ? path('build/' + file) : file;

	const folders = file.split('/').slice(0, -1);
	createDir(folders.join('/'));

	writeFileSync(file, content);

	return file;
}