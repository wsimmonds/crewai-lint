# CrewAI Lint

This is a VS Code extension that as an initial release provides that provides basic linting and validation for CrewAI YAML configuration files (`agents.yaml` and `tasks.yaml`). 

PLEASE NOTE: This is a third-party created module and it not directly associated with or authorized by CrewAI.

I plan to expand it to cover code-first configuration, subject to feedback which is welcome via https://github.com/wsimmonds/crewai-lint/issues


## Overview

CrewAI Lint helps developers working with [CrewAI](https://github.com/crewAIInc/crewAI) by providing real-time validation, error checking, and schema-based hover information for CrewAI configuration files.

## Features

- **Real-time Validation**: Automatically validates your `agents.yaml` and `tasks.yaml` files as you type
- **Error Diagnostics**: Provides detailed error messages for validation failures with proper line highlighting
- **Schema-Aware Hover Information**: Shows field descriptions and type information when hovering over YAML keys
- **Auto-Detection**: Automatically detects which CrewAI version you're using based on your project files - although only supporting 0.102.0 presently

## Issues / Roadmap

The following are known issues/planned to be resolved. Feedback and contributions are always welcome.

- [ ] No validation of field values except for checking agent is valid (i.e. should check context provided is valid, etc.)
- [ ] No support for anything but 0.102.0
- [ ] No support for Python validation
- [ ] No support for running as script/part of CI
- [ ] No icon
- [ ] Need to re-visit a number of design choices and make it easier to accurately update/maintain schemas - likely adopt ajv
- [ ] Need to improve test cases and adopt more "outside in" tests of schemas/expected outcomes to make changing internals easier

## Installation

This extension can be installed from the Visual Studio Code Marketplace.

1. Open VS Code
2. Go to Extensions view (Ctrl+Shift+X or Cmd+Shift+X)
3. Search for "CrewAI Linter"
4. Click Install

Alternatively, you can also install it using the VS Code CLI:

```bash
code --install-extension crewai-lint
```

## Usage

### Basic Usage

The extension automatically activates when you open YAML files named `agents.yaml` or `tasks.yaml`. No additional configuration is required.

### Setting CrewAI Version

By default, the extension tries to automatically detect your CrewAI version from:
- `requirements.txt`
- `pyproject.toml`
- `poetry.lock`

You can manually set the CrewAI version by:

1. Opening the command palette (Ctrl+Shift+P or Cmd+Shift+P)
2. Type "CrewAI: Set Version"
3. Select the version you want to use from the dropdown

### Hovering Information

Hover over any field in your YAML files to see:
- Whether the field is required or optional
- Field description
- Expected type information

### Field Validation

The extension validates:
- Required fields are present
- Field values have correct types
- YAML is properly formatted

## Development

### Prerequisites

- Node.js (>= 14.x)
- pnpm

### Setup

1. Clone the repository
```bash
git clone https://github.com/wsimmonds/crewai-lint.git
cd crewai-lint
```

2. Install dependencies
```bash
pnpm install
```

3. Open the project in VS Code
```bash
code .
```

### Building and Running

To compile and run the extension in development mode:

```bash
pnpm compile
pnpm watch  # For continuous compilation
```

**Enjoy!**
=======
To launch the extension in a new VS Code window:
1. Press F5 or select "Run and Debug" from the sidebar
2. Choose "Extension" from the dropdown menu

### Packaging

To build the extension into a distributable VSIX package:

```bash
pnpm run package
```

This will:
1. Compile the extension
2. Run the prepublish script
3. Package all necessary files into a `.vsix` file located in the root directory

You can install the packaged extension by:
- In VS Code: File > Preferences > Extensions > ... (More Actions) > Install from VSIX
- Command line: `code --install-extension crewai-lint-0.102.0.vsix`

### Testing

Run tests with:

```bash
pnpm test
```

For development, you can use watch mode:

```bash
pnpm test:watch
```

### Directory Structure

```
.
├── src/               # Source code
│   ├── extension.ts   # Main extension entry point
│   ├── schemaManager.ts # Schema version management
│   ├── versionDetection.ts # CrewAI version detection
│   ├── utils/         # Utility functions
│   └── schemas/       # Schema definitions by version
├── test/              # Test setup files
└── out/               # Compiled output
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [CrewAI](https://github.com/crewAIInc/crewAI) for producing a brilliant AI Agent framework.
- [João Moura](https://github.com/joaomdmoura) for having personally explained many concepts to me.
