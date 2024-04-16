# A simple and powerful WordPress environment

## Features

- **Dockerized WordPress** - Run WordPress in a Docker container.
- **FrankenPHP** - The Modern PHP App Server, written in Go.
- **WP-CLI** - The command line interface for WordPress.
- **PHPUnit 10** - The PHP testing framework.
- **Pest 2** - The elegant PHP testing framework.

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
		"env:stop": "wp-setup stop",
		"env:destroy": "wp-setup destroy",
		"env:run": "wp-setup run",
		"env:wp": "wp-setup wp",
		"env:help": "wp-setup help",
		"env:composer": "wp-setup run --workdir . wp-cli composer",
		"env:pest": "wp-setup run -w . wp-test-cli pest"
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

### Stop

To stop your WordPress environment, you can run the following command:

```bash
wp-setup stop
```

if you are using our suggested package.json scripts, you can run:

```bash

npm run env:stop
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
wp-setup run --workdir . wp-cli composer install
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

To run the tests, you can run the following command **The environment must be running**:

```bash
wp-setup run -w . wp-test-cli pest
```

If you are using our suggested package.json scripts, you can run:

```bash
npm run env:pest
```

## Todo

- [x] - Start Command
	- [x] - Create a docker-compose file based on template.
	- [x] - Bind flagged plugins, themes and volumes directories.
	- [x] - Start the docker-compose file.
	- [x] - Allow adding custom docker-compose file.
	- [x] - Ensure same configuration on commands.
	- [x] - Add custom project name.
	- [x] - Activate themes and plugins.
	- [x] - Add custom host name.
	- [ ] - Edit /etc/hosts file to add custom host name.
	- [x] - Add multisite support.
	- [ ] - Add xdebug support.
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
