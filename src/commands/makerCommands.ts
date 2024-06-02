import { exists } from "@/helpers/fs";
import { getProjectName } from '@/helpers/cli';
import { renderAndSave } from '@/services/template';
import AbstractCommand from './abstractCommand';

export default class MakerCommands extends AbstractCommand {
	public init = async (createTests: boolean) => {
		const projectName = getProjectName(false);

		if (!createTests) {
			const setupFile = `${process.cwd()}/wp-setup.json`;
			if (exists(setupFile)) {
				this.error('wp-setup.json already exists.');
			}

			await renderAndSave('wp-setup.json', setupFile, { projectName }, true);

			this.log('Setup file created.');
			this.log('Please edit wp-setup.json to configure the project.');
			this.log('Run `wp-setup start` to start the project.');
			this.success();
		}

		const phpUnitFile = `${process.cwd()}/phpunit.xml`;

		if (exists(phpUnitFile)) {
			this.error('phpunit.xml already exists.');
		}

		const testsDir = `${process.cwd()}/tests`;

		if (exists(testsDir)) {
			this.error('tests directory already exists.');
		}

		const cwd = process.cwd();
		const pluginName = cwd.split('/').pop();
		const options = { projectName, pluginName };

		const renderAndSaveTest = async (template: string) => {
			this.print(`Creating ${template} file...`);
			return renderAndSave(`test-suit/${template}`, `${cwd}/${template}`, options, true);
		}

		await renderAndSaveTest('phpunit.xml');
		await renderAndSaveTest('tests/bootstrap.php');
		await renderAndSaveTest('tests/Pest.php');
		await renderAndSaveTest('tests/TestCase.php');
		await renderAndSaveTest('tests/Feature/ExampleTest.php');
		await renderAndSaveTest('tests/Unit/ExampleTest.php');

		this.success('Test files created.');
	}
}