# A simple and powerful WordPress environment (under initial development)

## Features

- **Dockerized WordPress** - Run WordPress in a Docker container.
- **FrankenPHP** - The Modern PHP App Server, written in Go.
- **WP-CLI** - The command line interface for WordPress.

### Todo

- [x] - Start Command
	- [x] - Create a docker-compose file based on template.
	- [x] - Bind flagged plugins, themes and volumes directories.
	- [x] - Start the docker-compose file.
	- [x] - Allow adding custom docker-compose file.
	- [x] - Ensure same configuration on commands.
	- [x] - Add custom project name.
	- [x] - Activate themes and plugins.
	- [ ] - Add custom host name.
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
