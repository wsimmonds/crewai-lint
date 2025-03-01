// Mock implementation of the vscode API for testing
const vscode = {
  window: {
    showInformationMessage: jest.fn(),
    showErrorMessage: jest.fn(),
    showWarningMessage: jest.fn(),
    createOutputChannel: jest.fn().mockReturnValue({
      appendLine: jest.fn(),
      show: jest.fn()
    }),
    showQuickPick: jest.fn().mockResolvedValue(null),
    setStatusBarMessage: jest.fn()
  },
  workspace: {
    getConfiguration: jest.fn().mockReturnValue({
      get: jest.fn(),
      update: jest.fn(),
      has: jest.fn()
    }),
    onDidChangeTextDocument: jest.fn(),
    onDidOpenTextDocument: jest.fn(),
    workspaceFolders: [],
    textDocuments: []
  },
  languages: {
    registerHoverProvider: jest.fn(),
    createDiagnosticCollection: jest.fn().mockReturnValue({
      set: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
      dispose: jest.fn()
    })
  },
  commands: {
    registerCommand: jest.fn()
  },
  Range: jest.fn().mockImplementation((startLine, startChar, endLine, endChar) => ({
    start: { line: startLine, character: startChar },
    end: { line: endLine, character: endChar }
  })),
  Position: jest.fn().mockImplementation((line, character) => ({
    line,
    character
  })),
  Hover: jest.fn().mockImplementation((contents) => ({
    contents
  })),
  MarkdownString: jest.fn().mockImplementation((value) => ({
    value,
    isTrusted: false,
    supportThemeIcons: false
  })),
  DiagnosticSeverity: {
    Error: 0,
    Warning: 1,
    Information: 2,
    Hint: 3
  },
  Diagnostic: jest.fn().mockImplementation((range, message, severity) => ({
    range,
    message,
    severity,
    source: 'crewai-linter'
  })),
  Uri: {
    file: jest.fn().mockImplementation((path) => ({
      fsPath: path,
      scheme: 'file',
      path
    })),
    parse: jest.fn().mockImplementation((uri) => ({
      fsPath: uri,
      scheme: 'file',
      path: uri
    }))
  },
  EventEmitter: jest.fn().mockImplementation(() => ({
    event: jest.fn(),
    fire: jest.fn()
  })),
  ConfigurationTarget: {
    Global: 1,
    Workspace: 2,
    WorkspaceFolder: 3
  }
};

module.exports = vscode; 