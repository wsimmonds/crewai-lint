import * as vscode from 'vscode';
import * as yaml from 'js-yaml';
import * as path from 'path';
import * as fs from 'fs/promises';
import { SchemaManager } from './schemaManager';
import { ValidationError, ValidationResult } from './types/schema';

// Define interfaces for working with documents
interface AgentsConfig {
  [agentName: string]: any;
}

interface TasksConfig {
  [taskName: string]: any;
}

// Keep track of parsed agents data for cross-validation
const agentsCache = new Map<string, AgentsConfig>();

export function activate(context: vscode.ExtensionContext) {
  // Initialize schema manager and diagnostics collection
  const schemaManager = new SchemaManager();
  const diagnosticCollection = vscode.languages.createDiagnosticCollection('crewai');
  
  // Try to detect version on workspace open
  vscode.workspace.workspaceFolders?.forEach(async folder => {
    await schemaManager.setVersionFromWorkspace(folder.uri.fsPath);
    
    // Check version compatibility and display warnings after detection
    checkVersionCompatibility(schemaManager);
  });
  
  // Update validation when files change
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(event => 
      lintDocument(event.document, diagnosticCollection, schemaManager)
    ),
    vscode.workspace.onDidOpenTextDocument(document => 
      lintDocument(document, diagnosticCollection, schemaManager)
    )
  );

  // Lint all open YAML files on activation
  vscode.workspace.textDocuments.forEach(document => 
    lintDocument(document, diagnosticCollection, schemaManager)
  );
  
  // Register Set Version command
  const setVersionCommand = vscode.commands.registerCommand('crewai-lint.setVersion', async () => {
    const versions = schemaManager.getAvailableVersions();
    const selectedVersion = await vscode.window.showQuickPick(versions, {
      placeHolder: 'Select CrewAI version',
      title: 'Set CrewAI Version'
    });
    
    if (selectedVersion) {
      schemaManager.setCurrentVersion(selectedVersion);
      vscode.window.showInformationMessage(`Set CrewAI version to ${selectedVersion}`);
      
      // Re-lint open files with new schema
      vscode.workspace.textDocuments.forEach(document => {
        lintDocument(document, diagnosticCollection, schemaManager);
      });
      
      // Check version compatibility
      checkVersionCompatibility(schemaManager);
    }
  });
  
  context.subscriptions.push(setVersionCommand);
  
  // Register hover provider for CrewAI YAML files
  const hoverProvider = vscode.languages.registerHoverProvider(
    { language: 'yaml', pattern: '**/{agents,tasks}.yaml' },
    {
      provideHover(document, position) {
        const filename = path.basename(document.fileName);
        if (!['agents.yaml', 'tasks.yaml'].includes(filename)) {
          return null;
        }
        
        const wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) {
          return null;
        }
        
        const lineText = document.lineAt(position.line).text;
        const word = document.getText(wordRange);
        
        // Check if this is a key (field) in the YAML
        if (!isYAMLKey(lineText, wordRange.start.character)) {
          return null;
        }
        
        // Get the field path (including parent keys)
        const fieldPath = getYAMLPath(document, position);
        if (!fieldPath) {
          return null;
        }
        
        // Get schema info based on file type
        const schema = schemaManager.getCurrentSchema();
        if (!schema) {
          return null;
        }
        
        let fieldInfo;
        if (filename === 'agents.yaml') {
          fieldInfo = getFieldInfo(fieldPath, schema.agentSchema);
        } else { // tasks.yaml
          fieldInfo = getFieldInfo(fieldPath, schema.taskSchema);
        }
        
        if (!fieldInfo) {
          return null;
        }
        
        // Create hover content
        const mdContent = new vscode.MarkdownString();
        mdContent.appendMarkdown(`**${word}**\n\n`);
        
        if (fieldInfo.required) {
          mdContent.appendMarkdown('*Required field*\n\n');
        } else {
          mdContent.appendMarkdown('*Optional field*\n\n');
        }
        
        if (fieldInfo.description) {
          mdContent.appendMarkdown(`${fieldInfo.description}\n\n`);
        }
        
        if (fieldInfo.type) {
          mdContent.appendMarkdown(`Type: \`${formatType(fieldInfo.type)}\``);
        }
        
        return new vscode.Hover(mdContent);
      }
    }
  );
  
  context.subscriptions.push(hoverProvider);
  
  // Dispose diagnostics collection when extension is deactivated
  context.subscriptions.push(diagnosticCollection);
}

// This method is called when your extension is deactivated
export function deactivate() {}

/**
 * Check if the CrewAI version is compatible with the schema
 */
export async function checkVersionCompatibility(schemaManager: SchemaManager) {
  const schema = schemaManager.getCurrentSchema();
  if (!schema) {
    return;
  }
  
  // Get the schema version
  const schemaVersion = schema.version;
  
  // Check for unsupported versions (earlier than first supported version)
  if (schemaVersion === "0.102.0") {
    // This is our earliest supported version, so no warning needed
    return;
  }
  
  // Show warning for unsupported versions
  if (compareVersions(schemaVersion, "0.102.0") < 0) {
    const message = `CrewAI version ${schemaVersion} is not supported. The earliest supported version is 0.102.0.`;
    vscode.window.showWarningMessage(message);
  } else {
    // Show info for newer versions
    const message = `Using CrewAI schema version ${schemaVersion}`;
    vscode.window.showInformationMessage(message);
  }
}

/**
 * Compare two version strings
 * @returns -1 if a < b, 0 if a = b, 1 if a > b
 */
function compareVersions(a: string, b: string): number {
  const aParts = a.split('.').map(Number);
  const bParts = b.split('.').map(Number);
  
  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
    const aVal = aParts[i] || 0;
    const bVal = bParts[i] || 0;
    
    if (aVal < bVal) {
      return -1;
    }
    if (aVal > bVal) {
      return 1;
    }
  }
  
  return 0;
}

/**
 * Lint a document using the schema manager
 */
function lintDocument(
  document: vscode.TextDocument, 
  collection: vscode.DiagnosticCollection,
  schemaManager: SchemaManager
) {
  const filename = path.basename(document.fileName);
  if (!['agents.yaml', 'tasks.yaml'].includes(filename)) {
    return;
  }

  collection.clear();
  const diagnostics: vscode.Diagnostic[] = [];
  const text = document.getText();

  try {
    const data = yaml.load(text);
    if (!data || typeof data !== 'object') {
      diagnostics.push(new vscode.Diagnostic(
        new vscode.Range(0, 0, 0, 1),
        'File must contain a valid YAML object',
        vscode.DiagnosticSeverity.Error
      ));
      collection.set(document.uri, diagnostics);
      return;
    }

    // Validate based on file type
    let vsDiagnostics: vscode.Diagnostic[] = [];
    
    if (filename === 'agents.yaml') {
      // Cache the agents data for later cross-validation
      const dirPath = path.dirname(document.fileName);
      agentsCache.set(dirPath, data as AgentsConfig);
      
      // For agents, check if it's a nested structure (each top-level key is an agent name)
      // or a flat structure (the entire object is a single agent)
      let isNestedStructure = false;
      
      // Simple heuristic: if any top-level value is an object, and that object has agent-specific fields
      // then it's likely a nested structure with multiple agents
      for (const [key, value] of Object.entries(data)) {
        if (value && typeof value === 'object' && 
            (Object.prototype.hasOwnProperty.call(value, 'role') || 
             Object.prototype.hasOwnProperty.call(value, 'goal'))) {
          isNestedStructure = true;
          break;
        }
      }
      
      if (isNestedStructure) {
        // Each top-level key is an agent name
        for (const [agentName, agentConfig] of Object.entries(data)) {
          if (agentConfig && typeof agentConfig === 'object') {
            const validationResult = schemaManager.validateAgent(agentConfig);
            
            // Add agent name to the error messages for clarity
            const agentErrors = validationResult.errors.map(error => ({
              ...error,
              field: `${agentName}.${error.field}`,
              message: error.message
            }));
            
            vsDiagnostics = [...vsDiagnostics, ...convertErrorsToDiagnostics(agentErrors, document)];
          } else {
            // Agent configuration is not an object
            const lineNumber = getLineNumber(document, agentName);
            diagnostics.push(new vscode.Diagnostic(
              new vscode.Range(lineNumber, 0, lineNumber, agentName.length),
              `Agent '${agentName}' must be an object with proper configuration`,
              vscode.DiagnosticSeverity.Error
            ));
            vsDiagnostics = [...vsDiagnostics, ...diagnostics];
          }
        }
      } else {
        // The entire object is a single agent configuration
        const validationResult = schemaManager.validateAgent(data);
        vsDiagnostics = convertErrorsToDiagnostics(validationResult.errors, document);
      }
    } else { // tasks.yaml
      // For tasks, each top-level key is a task
      // Validate each task entry separately
      for (const [taskName, taskConfig] of Object.entries(data)) {
        if (taskConfig && typeof taskConfig === 'object') {
          const validationResult = schemaManager.validateTask(taskConfig);
          
          // Add task name to the error messages for clarity
          const taskErrors = validationResult.errors.map(error => ({
            ...error,
            field: `${taskName}.${error.field}`,
            message: error.message
          }));
          
          vsDiagnostics = [...vsDiagnostics, ...convertErrorsToDiagnostics(taskErrors, document)];
          
          // Check if agent references exist in the agents.yaml file
          const agentRefErrors = validateAgentReferences(taskName, taskConfig, document);
          vsDiagnostics = [...vsDiagnostics, ...agentRefErrors];
        } else {
          // Task configuration is not an object
          const lineNumber = getLineNumber(document, taskName);
          diagnostics.push(new vscode.Diagnostic(
            new vscode.Range(lineNumber, 0, lineNumber, taskName.length),
            `Task '${taskName}' must be an object with proper configuration`,
            vscode.DiagnosticSeverity.Error
          ));
          vsDiagnostics = [...vsDiagnostics, ...diagnostics];
        }
      }
    }
    
    collection.set(document.uri, vsDiagnostics);
  } catch (e: any) {
    // Handle YAML parsing errors
    diagnostics.push(new vscode.Diagnostic(
      new vscode.Range(0, 0, document.lineCount, 0),
      `Invalid YAML: ${e.message}`,
      vscode.DiagnosticSeverity.Error
    ));
    collection.set(document.uri, diagnostics);
  }
}

/**
 * Validate agent references in task configuration
 * Checks if agents referenced in tasks.yaml exist in the corresponding agents.yaml
 */
function validateAgentReferences(
  taskName: string,
  taskConfig: any,
  document: vscode.TextDocument
): vscode.Diagnostic[] {
  const diagnostics: vscode.Diagnostic[] = [];
  
  // Only check if agent field is present and is a string (not an object reference)
  if (!taskConfig.agent || typeof taskConfig.agent !== 'string') {
    return diagnostics;
  }
  
  const agentName = taskConfig.agent;
  const dirPath = path.dirname(document.fileName);
  const agentsData = agentsCache.get(dirPath);
  
  // If we don't have agents data from the same directory, no validation is possible
  if (!agentsData) {
    return diagnostics;
  }
  
  // Check if the agent exists in the cached agents data
  const agentExists = Object.prototype.hasOwnProperty.call(agentsData, agentName);
  
  if (!agentExists) {
    // Find the line number for the agent reference
    const taskLines = document.getText().split('\n');
    let lineNum = -1;
    
    for (let i = 0; i < taskLines.length; i++) {
      if (taskLines[i].includes(`agent: ${agentName}`)) {
        lineNum = i;
        break;
      }
    }
    
    if (lineNum >= 0) {
      const line = document.lineAt(lineNum);
      const agentIndex = line.text.indexOf(agentName);
      
      diagnostics.push(new vscode.Diagnostic(
        new vscode.Range(lineNum, agentIndex, lineNum, agentIndex + agentName.length),
        `Agent '${agentName}' referenced in task '${taskName}' does not exist in agents.yaml`,
        vscode.DiagnosticSeverity.Error
      ));
    }
  }
  
  return diagnostics;
}

/**
 * Convert validation errors to VS Code diagnostics
 */
function convertErrorsToDiagnostics(
  errors: ValidationError[], 
  document: vscode.TextDocument
): vscode.Diagnostic[] {
  return errors.map(error => {
    const line = getLineNumber(document, error.field);
    const lineText = document.lineAt(line).text;
    
    // Calculate the range - try to highlight either the field or the whole line
    let startColumn = 0;
    let endColumn = lineText.length;
    
    // For missing fields, we want to highlight the parent object's properties
    if (error.message.includes('Missing required field:')) {
      // Just highlight the indentation and the first property
      startColumn = lineText.search(/\S|$/); // First non-whitespace character
    } else {
      // For other errors, try to find the field name in the line
      const fieldName = error.field.includes('.') 
        ? error.field.split('.').pop() || error.field  // Get the last part after the dot
        : error.field;
        
      const fieldIndex = lineText.indexOf(fieldName);
      if (fieldIndex !== -1) {
        startColumn = fieldIndex;
        endColumn = fieldIndex + fieldName.length;
      }
    }
    
    return new vscode.Diagnostic(
      new vscode.Range(line, startColumn, line, endColumn),
      error.message,
      error.severity === 'error' 
        ? vscode.DiagnosticSeverity.Error 
        : vscode.DiagnosticSeverity.Warning
    );
  });
}

/**
 * Find the line number in the document for a given field path
 */
function getLineNumber(document: vscode.TextDocument, fieldPath: string): number {
  const text = document.getText();
  const lines = text.split('\n');
  
  // If field has dots, it's a nested path (e.g., task_name.field_name)
  const parts = fieldPath.split('.');
  const rootKey = parts[0];
  const fieldName = parts[parts.length - 1]; // The last part is the actual field
  
  // First find the root object
  let lineNumber = -1;
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed.startsWith(rootKey + ':')) {
      lineNumber = i;
      break;
    }
  }
  
  // If we're looking for the root object itself
  if (parts.length === 1) {
    return Math.max(0, lineNumber);
  }
  
  // If we're looking for a field within the object
  if (lineNumber >= 0) {
    // For missing fields, try to find the parent object
    const fieldRegex = new RegExp(`\\s+${fieldName}\\s*:`, 'i');
    
    // Search for the field within the section
    for (let i = lineNumber + 1; i < lines.length; i++) {
      const line = lines[i];
      // Stop if we reach a line with the same indentation as the root key or less
      // (indicating we've moved to a different top-level object)
      const indent = line.search(/\S|$/);
      if (indent <= 0 && line.trim() !== '') {
        break;
      }
      
      // Check if this line contains the field
      if (fieldRegex.test(line)) {
        return i;
      }
    }
    
    // If field not found, return the line number of the parent object
    return lineNumber;
  }
  
  // Default to first line if nothing found
  return 0;
}

/**
 * Check if the given position is on a YAML key
 */
function isYAMLKey(lineText: string, position: number): boolean {
  const colonIndex = lineText.indexOf(':', position);
  if (colonIndex === -1) {
    return false;
  }
  
  const textBeforeColon = lineText.substring(0, colonIndex).trim();
  return textBeforeColon.includes(lineText.substring(0, position).trim());
}

/**
 * Get the full path of a YAML key, including parent keys
 */
function getYAMLPath(document: vscode.TextDocument, position: vscode.Position): string | null {
  const lineText = document.lineAt(position.line).text;
  const currentIndent = lineText.search(/\S|$/);
  const keyMatch = lineText.match(/^(\s*)([^:]+):/);
  
  if (!keyMatch) {
    return null;
  }
  
  const currentKey = keyMatch[2].trim();
  
  // Find parent keys by looking at lines with less indentation
  const parentKeys: string[] = [];
  
  for (let line = position.line - 1; line >= 0; line--) {
    const parentLineText = document.lineAt(line).text;
    const parentIndent = parentLineText.search(/\S|$/);
    
    if (parentIndent < currentIndent && parentIndent >= 0) {
      const parentKeyMatch = parentLineText.match(/^(\s*)([^:]+):/);
      if (parentKeyMatch) {
        parentKeys.unshift(parentKeyMatch[2].trim());
        
        // If we reach a line with no indentation, we've found the root key
        if (parentIndent === 0) {
          break;
        }
      }
    }
  }
  
  // Build the full path
  if (parentKeys.length > 0) {
    return `${parentKeys.join('.')}.${currentKey}`;
  }
  
  return currentKey;
}

/**
 * Get information about a field from the schema
 */
function getFieldInfo(fieldPath: string, schema: any) {
  const parts = fieldPath.split('.');
  const lastPart = parts[parts.length - 1];
  
  // Check if it's a required field
  const isRequired = schema.requiredFields.includes(lastPart);
  
  // Get the field definition from optional fields
  const fieldDef = schema.optionalFields[lastPart];
  
  if (!fieldDef) {
    return null;
  }
  
  return {
    required: isRequired,
    description: fieldDef.description,
    type: fieldDef.type
  };
}

/**
 * Format a type for display
 */
function formatType(type: string | string[]): string {
  if (Array.isArray(type)) {
    return type.join(' | ');
  }
  
  return type;
}

/**
 * Check if a field is required based on the schema
 */
function isFieldRequired(field: string, fileType: string, schema: any): boolean {
  if (fileType === 'agents.yaml') {
    return schema.agentSchema.requiredFields.includes(field);
  } else if (fileType === 'tasks.yaml') {
    return schema.taskSchema.requiredFields.includes(field);
  }
  return false;
}

