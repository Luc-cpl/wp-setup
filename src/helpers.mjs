import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import readline from 'node:readline'
import { exit, stdin, stdout } from 'node:process'
import { promisify } from 'node:util'

// Use promisify to keep node 16 compatibility
const rl = readline.createInterface(stdin, stdout);
const question = promisify(rl.question).bind(rl);

export const path = (path = '') => {
	const __filename = fileURLToPath(import.meta.url);
	const __dirname = dirname(__filename);
	return join(__dirname, '../', path);
}

export const confirm = async (prompt, shouldReturn = false) => {
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