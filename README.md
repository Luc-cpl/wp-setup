# A simple and powerful WordPress environment (under initial development)

## Features

- **Dockerized WordPress** - Run WordPress in a Docker container.
- **FrankenPHP** - The Modern PHP App Server, written in Go.
- **WP-CLI** - The command line interface for WordPress.

## Pre-requisites

- [Docker](https://docs.docker.com/get-docker/)
- [Node.js](https://nodejs.org/en/download/) >= 16 (16 can throw some warnings during installation but it should work fine)

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
		"env:help": "wp-setup help"
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
		"${PWD}:my-plugin",
		"https://downloads.wordpress.org/plugin/query-monitor.zip:query-monitor"
	],
	"themes": [
		"${PWD}:my-theme",
		"https://downloads.wordpress.org/theme/twentytwenty.zip:twentytwenty"
	],
	"volumes": [
		"${PWD}/uploads:/var/www/html/wp-content/uploads"
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
	- [ ] - override existing host name if already exists in wordpress.
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
- [ ] - Composer Command

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
