# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2025-04-07

### Added

- Add support to PHP 8.4
- Add support to WordPress 6.7.2

## [1.2.2] - 2024-06-12

### Changed

- Add a `.wp-setup` directory in the project root to store internal files and avoid conflicts between environments

## [1.2.1] - 2024-06-10

### Fixed

- Fix version command

## [1.2.0] - 2024-06-10

### Added

- Console log colors for better readability
- Add a guest user home directory in CLI container to avoid permission issues
- Add `wp-setup code` command to open the project with Visual Studio Code with devcontainer support
- Add docker images to Docker Hub for easier access and faster setup
- Add node 22 in CLI container with support to npm, yarn and pnpm
- Support to run XDebug from host or CLI containers

### Changed

- Generate the docker-compose template file on each request to avoid errors and allow global installation
- Do not install Twenty Twenty-Four theme on setup to improve loading time

### Fixed

- Fix the ConfigInterface to correct assign the volumes related arrays

## [1.1.5] - 2024-06-01

### Changed

- Change package name to `wp-setup` to simplify package installation
