# A simple and powerful WordPress environment

## Features

- **Dockerized WordPress** - Run WordPress in a Docker container.
- **FrankenPHP** - The Modern PHP App Server, written in Go.
- **WP-CLI** - The command line interface for WordPress.
- **PHPUnit 10** - The PHP testing framework.
- **Pest 2** - The elegant PHP testing framework.
- **Xdebug** - The PHP debugger.

## Pre-requisites

- [Docker](https://docs.docker.com/get-docker/)
- [Node.js](https://nodejs.org/en/download/) >= 16 (16 may throw warnings during installation but it should work fine)

## Installation

This package is intended to be used as a development dependency.

```bash
npm install @luc-cpl/wp-setup --save-dev
```

Then you can add the following scripts to your `package.json` file:

```json
{
	"scripts": {
		"wp-setup": "wp-setup",
		"env:start": "wp-setup start",
		"env:start:xdebug": "wp-setup start --xdebug",
		"env:stop": "wp-setup stop",
		"env:stop:xdebug": "wp-setup stop --xdebug",
		"env:destroy": "wp-setup destroy",
		"env:run": "wp-setup run",
		"env:wp": "wp-setup wp",
		"env:help": "wp-setup help",
		"env:composer": "wp-setup run wp-cli --workdir . composer",
		"env:pest": "wp-setup run wp-test-cli --workdir . global-pest",
		"env:pest:coverage": "wp-setup run -w . wp-test-cli global-pest --coverage-html ./tests/coverage"
	}
}
```

**Pay attention in this case that npm may require the addition of `--` before passing flags to the command.**

## Usage

### Initiate the project configuration

To initiate the project configuration, you can run the following command:

```bash
wp-setup init
```

if you are using our suggested package.json scripts, you can run:

```bash
npm run wp-setup init
```

This will create a `wp-setup.json` file in the root of your project containing the necessary configurations to run the WordPress environment. Fell free to edit this file to fit your needs.

**Available options:**

- `include` - An docker-compose file to include in initialization with the default configuration.
- `multisite` - Define if the WordPress environment will be a multisite. Supports "subdomain" and "subdirectory". If true is set, the value will be "subdirectory".
- `host` - The host name to be used in the environment.
- `plugins` - An array of plugins to be installed in the environment. Each item should be a string following the pattern './path-to-plugin:plugin-name'.
- `themes` - An array of themes to be installed in the environment. Each item should be a string following the pattern './path-to-theme:theme-name'.
- `volumes` - An array of volumes to be mounted in the environment. Each item should be a string following the pattern './path-to-volume:/path-in-container'.

Also, **plugins, themes and volumes supports URL links to .zip files**, allowing easily download and install external plugins and themes.

All plugins and themes will be activated at the environment start.


### Start

To start your WordPress environment, you can run the following command:

```bash
wp-setup start
```

if you are using our suggested package.json scripts, you can run:

```bash
npm run env:start
```

If you want to start the environment with xdebug support, you can run:

```bash
wp-setup start --xdebug
```

if you are using our suggested package.json scripts, you can run:

```bash
npm run env:start:xdebug
```

This will start the WordPress environment with xdebug support for debugging in all PHP related containers (WP, WP-CLI and tests).

You can easily integrate your IDE with xdebug by mapping your project directories to the container directories.

For use with **VSCode**, you can add the following configuration to your `.vscode/launch.json` file (replace the pathMappings with your project directories accordingly):

```json
{
	"version": "0.2.0",
	"configurations": [
		{
			"name": "Listen for XDebug",
			"type": "php",
			"request": "launch",
			"port": 9003,
			"pathMappings": {
				"/var/www/html/wp-content/plugins/my-plugin": "${workspaceFolder}/plugins/my-plugin",
			}
		}
	]
}
```

### Stop

To stop your WordPress environment, you can run the following command:

```bash
wp-setup stop
```

if you are using our suggested package.json scripts, you can run:

```bash
npm run env:stop
```

If you want to only stop xdebug, you can run:

```bash
wp-setup stop --xdebug
```

if you are using our suggested package.json scripts, you can run:

```bash
npm run env:stop:xdebug
```

### Destroy

To fully destroy your WordPress environment, you can run the following command:

```bash
wp-setup destroy
```

if you are using our suggested package.json scripts, you can run:

```bash
npm run env:destroy
```

### Run

To run a command inside one container, you can run the following command:

```bash
wp-setup run <container> <command>
```

if you are using our suggested package.json scripts, you can run:

```bash
npm run env:run <container> <command>
```

Optionally, you can pass the `--workdir` (`-w`) flag to change the working directory of the command.

The working directory can be a relative path from the current directory present in the `wp-setup.json` file (as plugins, themes os volumes) or a absolute path from container.

This allow you to easily run composer commands, for example:

```bash
wp-setup run wp-cli --workdir . composer install
```

If you are using our suggested package.json scripts and the root directory is mounted, you can run:

```bash
npm run env:composer install
```


### WP CLI

To run a WP CLI command, you can run the following command:

```bash
wp-setup wp <command>
```

if you are using our suggested package.json scripts, you can run:

```bash
npm run env:wp <command>
```

## Test environment

WP Setup comes with **Pest 2** and **PHPUnit 10** already configured to run with WordPress.

You can easily setup your tests by running the following command:

```bash
wp-setup init --tests
```

If you are using our suggested package.json scripts, you can run:

```bash
npm run wp-setup -- --tests
```

This will create a `tests` directory and a `phpunit.xml` file in the root of your project containing the necessary files to run tests with Pest.

### Running tests with Pest

WP Setup comes with a globally installed Pest CLI to run tests.

To execute your tests you can run the following command **The environment must be running**:

```bash
wp-setup run wp-test-cli -w . global-pest
```

If you are using our suggested package.json scripts, you can run:

```bash
npm run env:pest
```

Also, you can use your composer installed Pest CLI to run tests:

```bash
wp-setup run wp-test-cli -w . ./vendor/bin/pest
```

### Generating coverage report

The test environment comes with xdebug support, allowing you to generate coverage reports by default.

To generate a coverage report in HTML format, you can run the following command **The environment must be running**:

```bash
wp-setup run -w . wp-test-cli global-pest --coverage-html ./tests/coverage
```

If you are using our suggested package.json scripts, you can run:

```bash
npm run env:pest:coverage
```

This will generate a `tests/coverage` directory with the coverage report with the HTML output.

You can also use the default CLI coverage, but in this case you current need to require Pest locally in your project:

```bash
wp-setup run -w . wp-cli composer require pestphp/pest yoast/phpunit-polyfills --dev
```

Then you can change the `global-pest` calls to `./vendor/bin/pest` in the commands above.

## Todo

- [x] - Start Command
	- [x] - Create a docker-compose file based on template.
	- [x] - Bind flagged plugins, themes and volumes in configuration.
	- [x] - Start the docker-compose file.
	- [x] - Allow adding custom docker-compose file.
	- [x] - Ensure same configuration on commands.
	- [x] - Add custom project name.
	- [x] - Activate themes and plugins.
	- [x] - Add custom host name.
	- [ ] - Edit /etc/hosts file to add custom host name.
	- [x] - Add multisite support.
	- [x] - Add xdebug support.
	- [x] - download plugins and themes from links during start.
- [x] - Configurations with JSON file.
- [x] - Test environment.
- [ ] - Build environment.
- [x] - Destroy Command
- [x] - Stop Command
- [x] - Run Command
- [x] - WP CLI Command
- [x] - Composer Command
- [x] - Prefix the project name to avoid naming collisions.
- [ ] - Allow custom WordPress version.
- [ ] - Add test coverage for the project.
- [ ] - Add Docker images to Docker Hub.

## Code Reference

If you find this project useful, please consider giving it a **Star** on GitHub!

For more details, check out the project repository:

- [GitHub Repository](https://github.com/Luc-cpl/wp-setup)

Here, you'll find additional information about the project, including the source code, issues, pull requests, and more.

## License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/Luc-cpl/wp-setup/blob/main/README.md) file for details.
