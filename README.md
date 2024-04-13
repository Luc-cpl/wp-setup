# A simple and powerful WordPress environment (under initial development)

## Features

- **Dockerized WordPress** - Run WordPress in a Docker container.
- **FrankenPHP** - The Modern PHP App Server, written in Go.
- **WP-CLI** - The command line interface for WordPress.

### Add custom config file

To easily load your configuration, you can create a `wp-setup.json` file in the root of your project.
Following you can see the available options, change them according to your needs.

```json
// wp-setup.json
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

### Todo

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
