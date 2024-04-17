import { exists } from "../helpers/fs.mjs";
import { getProjectName } from '../helpers/cli.mjs';
import { renderAndSave } from '../services/template.mjs';
import AbstractCommand from './abstractCommand.mjs';

export default class MakerCommands extends AbstractCommand {

	init = async (createTests) => {
		const projectName = getProjectName(false);

		if (!createTests) {
			const setupFile = `${process.cwd()}/wp-setup.json`;
			if (exists(setupFile)) {
				this.__error('wp-setup.json already exists.');
			}

			await renderAndSave('wp-setup.json', setupFile, { projectName }, true);

			this.__success('Setup file created.', false);
			this.__success('Please edit wp-setup.json to configure the project.', false);
			this.__success('Run `wp-setup start` to start the project.', false);
			this.__success();
		}

		const phpUnitFile = `${process.cwd()}/phpunit.xml`;

		if (exists(phpUnitFile)) {
			this.__error('phpunit.xml already exists.');
		}

		const testsDir = `${process.cwd()}/tests`;

		if (exists(testsDir)) {
			this.__error('tests directory already exists.');
		}

		const cwd = process.cwd();
		const pluginName = cwd.split('/').pop();
		const options = { projectName, pluginName };

		const renderAndSaveTest = async (template) => {
			this.__print(`Creating ${template} file...`);
			return renderAndSave(`test-suit/${template}`, `${cwd}/${template}`, options, true);
		}

		await renderAndSaveTest('phpunit.xml');
		await renderAndSaveTest('tests/bootstrap.php');
		await renderAndSaveTest('tests/Pest.php');
		await renderAndSaveTest('tests/TestCase.php');
		await renderAndSaveTest('tests/Feature/ExampleTest.php');
		await renderAndSaveTest('tests/Unit/ExampleTest.php');

		this.__success('Test files created.');
	}

}