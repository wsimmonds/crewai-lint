export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
  }
  
  export interface ValidationError {
    message: string;
    field: string;
    severity: 'error' | 'warning' | 'info';
  }
  
  export interface FieldDefinition {
    type: string | string[];
    description: string;
    validator?: (value: any) => boolean;
  }
  
  export interface AgentSchemaDefinition {
    requiredFields: string[];
    optionalFields: Record<string, FieldDefinition>;
  }
  
  export interface TaskSchemaDefinition {
    requiredFields: string[];
    optionalFields: Record<string, FieldDefinition>;
  }
  
  export interface CrewAISchema {
    version: string;
    agentSchema: AgentSchemaDefinition;
    taskSchema: TaskSchemaDefinition;
    validateAgent(data: any): ValidationResult;
    validateTask(data: any): ValidationResult;
  }