import * as yaml from 'js-yaml';
import { taskSchema } from './task';
import { createValidator } from '../../utils';

describe('TaskSchema for version 0.102.0', () => {
  it('should validate a task with all required fields', () => {
    const validator = createValidator(taskSchema);
    
    const task = {
      description: 'A test task',
      expected_output: 'Expected output'
    };
    
    const result = validator(task);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should validate a task with multi-line strings', () => {
    const validator = createValidator(taskSchema);
    
    const task = {
      description: 'A test task with multi-line description\nthat spans multiple lines',
      expected_output: 'Expected output\nthat spans multiple lines'
    };
    
    const result = validator(task);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
  
  it('should fail when validating a nested YAML structure directly - BUG DEMONSTRATION', () => {
    // Create validator for tasks
    const validator = createValidator(taskSchema);
    
    // This is the YAML content that causes the issue
    const yamlContent = `
profile_user:
  description: >
    Analyze the provided user profile information: their topic of learning is EXACTLY "{topic}".
  agent: user_profiler
  expected_output: >
    A comprehensive learner profile including: the topic they want to learn.
`;
    
    // Parse the YAML
    const data = yaml.load(yamlContent);
    
    // Validating the entire object will fail
    const result = validator(data);
    
    // This should fail because the top-level object doesn't have the required fields
    // The required fields are inside profile_user, not at the top level
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
  
  it('should pass when validating nested YAML structure correctly - FIX DEMONSTRATION', () => {
    // Create validator for tasks
    const validator = createValidator(taskSchema);
    
    // This is the YAML content that caused the issue
    const yamlContent = `
profile_user:
  description: >
    Analyze the provided user profile information: their topic of learning is EXACTLY "{topic}".
  agent: user_profiler
  expected_output: >
    A comprehensive learner profile including: the topic they want to learn.
`;
    
    // Parse the YAML
    const parsedYaml = yaml.load(yamlContent) as Record<string, any>;
    
    // Validate each task entry separately (how the fixed extension.ts will work)
    let allValid = true;
    let errors: any[] = [];
    
    for (const [taskName, taskConfig] of Object.entries(parsedYaml)) {
      const result = validator(taskConfig);
      if (!result.valid) {
        allValid = false;
        errors = [...errors, ...result.errors.map(err => ({
          ...err, 
          field: `${taskName}.${err.field}`
        }))];
      }
    }
    
    // Validating each task entry separately should pass
    expect(allValid).toBe(true);
    expect(errors).toHaveLength(0);
  });
}); 