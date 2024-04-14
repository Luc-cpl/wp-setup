# A simple and powerful WordPress environment

## Features

- **Dockerized WordPress** - Run WordPress in a Docker container.
- **FrankenPHP** - The Modern PHP App Server, written in Go.
- **WP-CLI** - The command line interface for WordPress.

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
		"env:start": "wp-setup start",
		"env:stop": "wp-setup stop",
		"env:destroy": "wp-setup destroy",
		"env:run": "wp-setup run",
		"env:wp": "wp-setup wp",
		"env:help": "wp-setup help",
		"env:composer": "wp-setup run --workdir . wp-cli composer"
	}
}
```

**Pay attention in this case that npm may require the addition of `--` before passing flags to the command.**

## Usage

### Add custom config file

To easily load your configuration, you can create a `wp-setup.json` file in the root of your project.
Following you can see the available options, change them according to your needs.

```json
{
	"host": "my-wordpress.localhost",
	"include": "./docker-compose-override.yml",
	"multisite": true,
	"plugins": [
		".:my-plugin",
		"https://downloads.wordpress.org/plugin/query-monitor.zip:query-monitor"
	],
	"themes": [
		".:my-theme",
		"https://downloads.wordpress.org/theme/twentytwenty.zip:twentytwenty"
	],
	"volumes": [
		"./uploads:/var/www/html/wp-content/uploads"
	]
}
```

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
- [ ] - Test environment.
- [ ] - Build environment.
- [x] - Destroy Command
- [x] - Stop Command
- [x] - Run Command
- [x] - WP CLI Command
- [x] - Composer Command
- [x] - Prefix the project name to avoid naming collisions.

## Code Reference

If you find this project useful, please consider giving it a **Star** on GitHub!

For more details, check out the project repository:

- [GitHub Repository](https://github.com/Luc-cpl/wp-setup)

Here, you'll find additional information about the project, including the source code, issues, pull requests, and more.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
