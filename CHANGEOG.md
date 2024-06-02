# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Console log colors for better readability

### Changed

- Generate the docker-compose template file on each request to avoid errors and allow global installation
- Do not install Twenty Twenty-Four theme on setup to improve loading time

### Fixed

- Fix the ConfigInterface to correct assign the volumes related arrays

## [1.1.5] - 2024-06-01

### Changed

- Change package name to `wp-setup` to simplify package installation