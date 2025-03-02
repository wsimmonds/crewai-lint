import { CrewAISchema, ValidationResult } from './types/schema';
import { detectCrewAIVersion } from './versionDetection';
import * as fs from 'fs/promises';
import * as path from 'path';

export class SchemaManager {
  private schemas: Map<string, CrewAISchema> = new Map();
  private currentVersion: string = "latest";
  
  constructor() {
    // Load schemas dynamically
    this.loadSchemas();
  }
  
  /**
   * Load all schema versions from the schemas directory
   */
  private async loadSchemas(): Promise<void> {
    try {
      // Get the schemas directory path
      const schemaDir = path.join(__dirname, 'schemas');
      
      // Read all subdirectories (version directories)
      const versionDirs = await fs.readdir(schemaDir);
      
      for (const versionDir of versionDirs) {
        // Skip test files and non-directories
        if (versionDir.includes('.test.') || versionDir.endsWith('.map') || 
            !(await fs.stat(path.join(schemaDir, versionDir))).isDirectory()) {
          continue;
        }

        try {
          // Import the schema from the version directory
          const schemaModule = await import(`./schemas/${versionDir}/index`);
          
          // Register the schema
          if (schemaModule && schemaModule.schema) {
            this.registerSchema(schemaModule.schema);
          }
        } catch (err) {
          console.error(`Error loading schema for version ${versionDir}:`, err);
        }
      }
      
      // Set latest as alias to the most recent version
      const schemas = Array.from(this.schemas.values());
      if (schemas.length > 0) {
        // Sort schemas by version (assuming semver-like format)
        schemas.sort((a, b) => {
          const aVersion = a.version.split('.').map(Number);
          const bVersion = b.version.split('.').map(Number);
          
          for (let i = 0; i < Math.max(aVersion.length, bVersion.length); i++) {
            const aVal = aVersion[i] || 0;
            const bVal = bVersion[i] || 0;
            if (aVal !== bVal) {
              return aVal - bVal;
            }
          }
          
          return 0;
        });
        
        this.schemas.set('latest', schemas[schemas.length - 1]);
      }
    } catch (err) {
      console.error('Error loading schemas:', err);
    }
  }
  
  /**
   * Register a schema version
   */
  registerSchema(schema: CrewAISchema): void {
    this.schemas.set(schema.version, schema);
  }
  
  /**
   * Detect and set the CrewAI version from the workspace
   */
  async setVersionFromWorkspace(workspacePath: string): Promise<void> {
    this.currentVersion = await detectCrewAIVersion(workspacePath);
  }
  
  /**
   * Get the current schema based on the set version
   */
  getCurrentSchema(): CrewAISchema {
    return this.schemas.get(this.currentVersion) || 
           this.schemas.get("latest") || 
           Array.from(this.schemas.values()).pop()!;
  }
  
  /**
   * Validate agent configuration against schema
   */
  validateAgent(data: any): ValidationResult {
    const schema = this.getCurrentSchema();
    if (!schema) {
      return { valid: false, errors: [{ field: "", message: "CrewAI Lint: No schema found. If first install of extension, try closing/re-opening file.", severity: "info" }] };
    }
    
    // Add prefix to all error messages
    const result = schema.validateAgent(data);
    return this.prefixValidationMessages(result);
  }
  
  /**
   * Validate task configuration against schema
   */
  validateTask(data: any): ValidationResult {
    const schema = this.getCurrentSchema();
    if (!schema) {
      return { valid: false, errors: [{ field: "", message: "CrewAI Lint: No schema found. If first install of extension, try closing/re-opening file.", severity: "info" }] };
    }
    
    // Add prefix to all error messages
    const result = schema.validateTask(data);
    return this.prefixValidationMessages(result);
  }
  
  /**
   * Add "CrewAI Lint: " prefix to all validation messages
   */
  private prefixValidationMessages(result: ValidationResult): ValidationResult {
    return {
      ...result,
      errors: result.errors.map(error => ({
        ...error,
        message: error.message.startsWith("CrewAI Lint: ") ? error.message : `CrewAI Lint: ${error.message}`
      }))
    };
  }
  
  /**
   * Get a list of all available schema versions
   */
  getAvailableVersions(): string[] {
    // Filter out 'latest' which is an alias
    return Array.from(this.schemas.keys()).filter(v => v !== 'latest');
  }
  
  /**
   * Manually set the current version
   */
  setCurrentVersion(version: string): void {
    this.currentVersion = version;
  }
}
