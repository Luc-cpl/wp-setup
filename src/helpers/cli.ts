import crypto from 'crypto';
import readline from 'node:readline'
import { exit, stdin, stdout } from 'node:process'
import { promisify } from 'node:util'

// Use promisify to keep node 16 compatibility
const rl = readline.createInterface(stdin, stdout);
const question = promisify(rl.question).bind(rl) as unknown as (prompt: string) => Promise<string>;

export const getProjectName = (prefixed = true): string => {
	const hash = crypto.createHash('md5').update(process.cwd()).digest('hex').slice(0, 6);
	const name = process.cwd().split('/').pop()?.toLowerCase().replace(/[^a-z0-9]/gi, '-');
	if (!name) {
		throw new Error('Invalid project name');
	}
	return prefixed ? `${hash}-${name}` : name;
}

export const confirm = async (prompt: string, shouldReturn = false) => {
	const answer = await question(`${prompt} (y/n) `);
	rl.close();

	if (answer.toLowerCase() !== 'y') {
		if (shouldReturn) {
			return false;
		}
		exit(0);
	}

	return true;
}