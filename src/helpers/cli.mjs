import readline from 'node:readline'
import { exit, stdin, stdout } from 'node:process'
import { promisify } from 'node:util'

// Use promisify to keep node 16 compatibility
const rl = readline.createInterface(stdin, stdout);
const question = promisify(rl.question).bind(rl);

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