# A simple and powerful WordPress environment

## Features

- **Dockerized WordPress** - Run WordPress in a Docker container.
- **FrankenPHP** - The Modern PHP App Server, written in Go.
- **WP-CLI** - The command line interface for WordPress.
- **PHPUnit 10** - The PHP testing framework.
- **Pest 2** - The elegant PHP testing framework.
- **Xdebug** - The PHP debugger.
- **Dev Container Support** - Easily run your project with Visual Studio Code.
- **Node 22** - The Node.js runtime in CLI's container with npm, yarn and pnpm support.

## Pre-requisites

- [Docker](https://docs.docker.com/get-docker/)
- [Node.js](https://nodejs.org/en/download/) >= 18

Yes, you do not need any server, MySQL database or even PHP. All will run from our custom docker environment.

## Installation

Although it is possible and in some cases recommended to install WP Setup globally, we recommend to install at project basis. This way all configuration will bee keep in your project and can be easily replicate by all your team members. It can drastically reduce new tem members onboarding and facilitate project replication and testing.

So to add it in your project, first ensure you have a npm package started. If not you just need to run the following command in our project directory:

```bash
npm init -y
```

Then you can simply add WP Setup as a development dependency to your project and call the init command to create your setup file.

```bash
npm install wp-setup --save-dev
npx wp-setup init
```

This commands will install WP Setup and will create a file called wp-setup.json in your project root directory. This file is responsible for all your configurations.

As you can see in the commands above, after install the WP Setup as dependency, you can run our CLI calling npx wp-setup <comand...>. To simplify some usual commands, we recommend that you also add the following scripts to your package.json file (created after npm init).

```json
"scripts": {
    "env:start": "wp-setup start",
    "env:stop": "wp-setup stop",
    "env:destroy": "wp-setup destroy",
    "env:composer": "wp-setup run wp-cli --workdir . composer",
    "env:pest": "wp-setup run wp-test-cli --workdir . global-pest"
}
```

Now you can simply start your new environment just calling:

```bash
npm run env:start
# or
npx wp-setup start
```

And to stop the environment:

```bash
npm run env:stop
# or
npx wp-setup stop
```

Also you can destroy the current environmend installation with all volumes running:

```bash
npx wp-setup destroy
```

## Code Reference

If you find this project useful, please consider giving it a **Star** on [GitHub](https://github.com/Luc-cpl/wp-setup)!

For more details, check out the project documentation:
	- [WP Setup](https://lucascarvalho.site/wp-setup/docs/getting-started/)

## License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/Luc-cpl/wp-setup/blob/main/README.md) file for details.
