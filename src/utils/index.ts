import { AgentSchemaDefinition, TaskSchemaDefinition, ValidationResult, ValidationError } from '../types/schema';

export function createValidator(schema: AgentSchemaDefinition | TaskSchemaDefinition) {
  return (data: any): ValidationResult => {
    const errors: ValidationError[] = [];
    
    // Check for required fields
    for (const field of schema.requiredFields) {
      if (!data[field]) {
        errors.push({
          field,
          message: `Missing required field: ${field}`,
          severity: 'error'
        });
      }
    }
    
    // Check for unrecognized fields and enforce case sensitivity
    for (const [key, value] of Object.entries(data)) {
      // Skip fields that exactly match the required fields list
      if (schema.requiredFields.includes(key)) {
        continue;
      }

      // Check if this is a recognized field from the optional fields
      const fieldDef = schema.optionalFields[key];
      
      if (!fieldDef) {
        // Check if this is a case-insensitive match (wrong case)
        const lowerCaseKey = key.toLowerCase();
        const matchingOptionalFieldKey = Object.keys(schema.optionalFields)
          .find(field => field.toLowerCase() === lowerCaseKey);
        
        if (matchingOptionalFieldKey) {
          // It's a case-insensitive match, so flag it as using wrong case
          errors.push({
            field: key,
            message: `Field '${key}' uses incorrect case. Use '${matchingOptionalFieldKey}' instead.`,
            severity: 'error'
          });
        } else {
          // It's not even a case-insensitive match, so it's an unrecognized field
          errors.push({
            field: key,
            message: `Unrecognized field: '${key}'. This field is not defined in the schema.`,
            severity: 'error'
          });
        }
        continue;
      }
      
      // Field is recognized, now check type
      if (!isValidType(value, fieldDef.type)) {
        errors.push({
          field: key,
          message: `Field '${key}' has invalid type. Expected ${fieldDef.type}, got ${typeof value}`,
          severity: 'warning'
        });
      }
      
      // Custom validation if specified
      if (fieldDef.validator && !fieldDef.validator(value)) {
        errors.push({
          field: key,
          message: `Field '${key}' failed validation`,
          severity: 'warning'
        });
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  };
}

function isValidType(value: any, expectedType: string | string[]): boolean {
  if (Array.isArray(expectedType)) {
    return expectedType.some(type => isValidType(value, type));
  }
  
  switch (expectedType) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number';
    case 'boolean':
      return typeof value === 'boolean';
    case 'array':
      return Array.isArray(value);
    case 'object':
      return typeof value === 'object' && value !== null && !Array.isArray(value);
    default:
      return false;
  }
}
