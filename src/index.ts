#!/usr/bin/env node

import { program } from 'commander';

import { ConfigInterface } from '@/interfaces/setup';

import { getJsonFile } from '@/helpers/fs';

import DockerCommands from '@/commands/dockerCommands';
import MakerCommands from '@/commands/makerCommands';

const setupFile = getJsonFile(`${process.cwd()}/wp-setup.json`) ?? {} as ConfigInterface;

const docker = new DockerCommands(setupFile);
const maker = new MakerCommands(setupFile);

program.command('init')
  .description('Create the setup files for the environment.')
  .option('--tests', 'Create the WordPress tests files instead of the development environment.', false)
  .action(({tests}) => maker.init(tests));

program.command('start')
  .description('Start the development environment.')
  .option('--xdebug', 'Enable XDebug for the development environment.', false)
  .action(options => docker.start(options));

program.command('destroy')
  .description('Destroy the development environment.')
  .action(() => docker.destroy());

program.command('stop')
  .description('Stop the development environment.')
  .option('--xdebug', 'Only stop XDebug for the development environment.', false)
  .action(options => docker.stop(options));

program.command('run')
  .description('Run a command in the development environment.')
  .option('-w, --workdir <directory>', 'Can be a binded relative path from host or an absolute path in the container (default to service workdir).')
  .argument('<service>', 'The service to run the command on.')
  .argument('<command...>', 'The command to run in the service.')
  .allowUnknownOption()
  .action((service, command, { workdir }) => docker.run(service, command, workdir));

program.command('wp')
  .description('Run a WP_CLI command in the development environment.')
  .argument('<command...>', 'The WP_CLI command to run.')
  .allowUnknownOption()
  .action(command => docker.wpCli(command));

program.command('wp-test')
  .description('Run a WP_CLI command in the test environment.')
  .argument('<command...>', 'The WP_CLI command to run.')
  .allowUnknownOption()
  .action(command => docker.wpCliTest(command));

program.parse();