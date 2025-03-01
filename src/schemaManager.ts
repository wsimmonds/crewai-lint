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
      return { valid: false, errors: [{ field: "", message: "No schema available", severity: "error" }] };
    }
    return schema.validateAgent(data);
  }
  
  /**
   * Validate task configuration against schema
   */
  validateTask(data: any): ValidationResult {
    const schema = this.getCurrentSchema();
    if (!schema) {
      return { valid: false, errors: [{ field: "", message: "No schema available", severity: "error" }] };
    }
    return schema.validateTask(data);
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
