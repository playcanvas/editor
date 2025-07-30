# Contributing to PlayCanvas Editor UI

Thank you for your interest in contributing to the PlayCanvas Editor UI! This guide will help you get started with contributing to this project.

Looking for ideas? Check out issues under the [good first issue](https://github.com/playcanvas/editor/issues?q=is%3Aissue%20state%3Aopen%20label%3A%22good%20first%20issue%22) label or create an issue to start a conversation. The [Forum](https://playcanvas.com) is a good place to discuss ideas with the community as well. It strongly advised to create an issue or community post when suggesting major changes or add significant features to get advice on how to approach it.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Reporting Issues](#reporting-issues)
- [Getting Help](#getting-help)

## Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct. Please be respectful and constructive in all interactions.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- [Git](https://git-scm.com/)
- A GitHub account

### Development Setup

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/editor-ui.git
   cd editor-ui
   ```

3. **Add the upstream remote**:
   ```bash
   git remote add upstream https://github.com/playcanvas/editor-ui.git
   ```

4. **Install dependencies**:
   ```bash
   npm install
   ```

5. **Start the development server**:
   ```bash
   npm run develop
   ```

6. **Test the local build** by visiting PlayCanvas Editor with the query parameter:
   ```
   https://playcanvas.com/editor/project/YOUR_PROJECT_ID?use_local_frontend
   ```

## Project Structure

The project is organized as follows:

```
editor-ui/
├── src/                   # Source code
│   ├── editor/            # Main editor functionality
│   ├── code-editor/       # Code editor components
│   ├── common/            # Shared utilities
│   ├── core/              # Core editor systems
│   ├── launch/            # Launch page functionality
│   └── plugins/           # Editor plugins
├── sass/                  # SCSS stylesheets
│   ├── editor/            # Editor-specific styles
│   ├── pcui/              # PCUI component styles
│   └── common/            # Shared styles
├── test/                  # Test files
├── modules/               # Additional modules
└── dist/                  # Built files (generated)
```

## Development Workflow

### Branch Management

1. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Keep your branch up to date**:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

### Making Changes

1. **Write clear, concise commit messages**:
   ```
   feat: add new asset inspector component
   
   - Add support for custom asset types
   - Improve preview functionality
   - Update related documentation
   ```

2. **Test your changes** thoroughly:
   ```bash
   npm test
   npm run lint
   npm run type:check
   ```

3. **Build the project** to ensure everything compiles:
   ```bash
   npm run build
   ```

## Coding Standards

### JavaScript/TypeScript

- Follow the existing ESLint configuration (`@playcanvas/eslint-config`)
- Use TypeScript for new files where applicable
- Prefer modern ES6+ syntax
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

### CSS/SCSS

- Follow the existing Stylelint configuration
- Use BEM methodology for CSS class naming
- Organize styles by component/feature
- Use SCSS variables for consistent theming

### Code Formatting

The project uses ESLint for JavaScript/TypeScript and Stylelint for CSS/SCSS. Run the linters before committing:

```bash
npm run lint
```

## Testing

### Running Tests

Testing for the Editor UI is handled through the [playcanvas/editor-test](https://github.com/playcanvas/editor-test) repository. Tests are automatically triggered via GitHub Actions workflow when a pull request is labeled with `test`.

The test workflow:
1. Builds a Docker image of the Editor UI
2. Runs comprehensive end-to-end tests against the PlayCanvas platform
3. Tests are executed in a containerized environment with access to PlayCanvas services

To run tests on your PR:
1. Ensure your PR is ready for testing
2. A maintainer will add the `test` label to trigger the test suite
3. Monitor the test results in the GitHub Actions tab

### Test Environment

Tests run with the following configuration:
- Docker-based test environment
- Integration with PlayCanvas platform services
- Access to live PlayCanvas editor functionality
- Automated UI and functional testing

### Writing Tests

If you need to add new test cases:
- Tests should be added to the [playcanvas/editor-test](https://github.com/playcanvas/editor-test) repository
- Follow the existing test patterns in that repository
- Coordinate with maintainers for test additions

## Submitting Changes

### Pull Request Process

1. **Push your branch** to your fork:
   ```bash
   git push origin feat/your-feature-name
   ```

2. **Create a Pull Request** on GitHub with:
   - Clear title describing the change
   - Detailed description of what was changed and why
   - Screenshots or GIFs for UI changes
   - Reference to any related issues

3. **Respond to feedback** promptly and make requested changes

4. **Ensure CI passes** - all tests and linting must pass

### Pull Request Guidelines

- Keep PRs focused and atomic (one feature/fix per PR)
- Consider the scope of the feature (wider application = more risk)
- Include tests for new functionality
- Update documentation as needed
- Ensure backward compatibility when possible
- Follow the existing code style and patterns
- Reuse existing functionality over reimplementation when possible

## Reporting Issues

When reporting bugs or requesting features:

1. **Check existing issues** first to avoid duplicates
2. **Use the issue templates** when available
3. **Provide detailed information**:
   - Steps to reproduce (for bugs)
   - Expected vs actual behavior
   - Browser and OS information
   - Relevant console errors or logs
   - Screenshots or recordings when helpful

## Getting Help

- **GitHub Issues**: For bug reports and feature requests
- **Discussions**: For questions and general discussion
- **PlayCanvas Forum**: https://forum.playcanvas.com
- **Discord**: Join the PlayCanvas community Discord

## Development Tips

### Useful Commands

```bash
# Development with hot reload
npm run develop

# Build for production
npm run build

# Watch and rebuild CSS only
npm run watch:css

# Watch and rebuild JavaScript only
npm run watch:js

# Run linting
npm run lint

# Type checking
npm run type:check

# Serve built files
npm run serve
```

### Editor Integration

- The Editor UI integrates with the PlayCanvas platform
- Test changes using the `?use_local_frontend` parameter
- Be mindful of backward compatibility with existing projects

### Performance Considerations

- The Editor handles large scenes and many assets
- Consider performance impact of changes
- Use browser dev tools to profile changes
- Test with complex projects when possible

## Release Process

Releases are handled by the maintainers. Contributors should:

- Ensure changes are well-tested
- Update version numbers only when instructed
- Follow semantic versioning principles
- Document breaking changes clearly

## Recognition

Contributors will be recognized in release notes and the project's contributor list. We appreciate all forms of contribution, from code to documentation to issue reports.

Thank you for contributing to PlayCanvas Editor UI! 🎮
