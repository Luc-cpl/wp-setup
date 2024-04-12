#!/usr/bin/env node

import { program } from 'commander';

import * as docker from './src/commands/docker.mjs';

export const parseVolumes = (value, previous) => {
	value = value.split(':');
	const [host, container] = value;
	return [...previous ?? [], { host, container }];
}

program.command('start')
  .description('Start the development environment.')
  .option('-i, --include <file>', 'A custom docker-compose file to include.', '')
  .option('-p, --plugin <directory:name...>', 'Plugins to include in the development environment.', parseVolumes)
  .option('-t, --theme <directory:name...>', 'Themes to include in the development environment.', parseVolumes)
  .option('-v, --volume <host:container...>', 'Additional volumes to include in the development environment.', parseVolumes)
  .option('--host <host>', 'The host to expose the development environment on.', 'localhost')
  .option('--test-host <host>', 'The host to expose the test environment on.', 'test.localhost')
  .option('--xdebug', 'Enable XDebug for the development environment.', false)
  .option('--multisite [type]', 'Enable multisite for the development environment (subdomain or subdirectory, defaults to subdirectory).', false)
  .action(docker.start);

program.command('destroy')
  .description('Destroy the development environment.')
  .action(docker.destroy);

program.command('stop')
  .description('Stop the development environment.')
  .action(docker.stop);

program.command('run')
  .description('Run a command in the development environment.')
  .argument('<service>', 'The service to run the command on.')
  .argument('<command...>', 'The command to run in the service.')
  .allowUnknownOption()
  .action(docker.run);

program.command('wp')
  .description('Run a WP_CLI command in the development environment.')
  .argument('<command...>', 'The WP_CLI command to run.')
  .allowUnknownOption()
  .action(docker.wpCli);

program.parse();