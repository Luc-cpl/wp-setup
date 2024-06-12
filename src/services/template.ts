import { Edge } from 'edge.js'
import { writeFileSync } from 'fs';

import { createDir, path, setupDir } from '@/helpers/fs';
import { join } from 'path';

export const render = async (template: string, options: Record<string, unknown> = {}) => {
	const edge = Edge.create();
	edge.mount(path('templates'));
	return edge.render(template, options);
}

export const renderAndSave = async (template: string, file: string, options: Record<string, unknown> = {}, project = false) => {
	const content = await render(template, options);
	return await save(file, content, project);
}

export const save = async (file: string, content: string, project = false) => {
	file = !project ? join(setupDir(), file) : file;

	const folders = file.split('/').slice(0, -1);
	createDir(folders.join('/'));

	writeFileSync(file, content);

	return file;
}