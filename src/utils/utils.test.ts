import { createValidator } from './index';
import { AgentSchemaDefinition, TaskSchemaDefinition } from '../types/schema';

describe('Utils', () => {
  describe('createValidator', () => {
    // Mock schema definition
    const mockSchema: AgentSchemaDefinition = {
      requiredFields: ['name', 'role'],
      optionalFields: {
        name: { 
          type: 'string', 
          description: 'Agent name',
        },
        role: { 
          type: 'string', 
          description: 'Agent role',
        },
        goal: { 
          type: 'string', 
          description: 'Agent goal',
        },
        allow_delegation: { 
          type: 'boolean', 
          description: 'Allow agent to delegate tasks',
        },
        verbose: { 
          type: 'boolean', 
          description: 'Verbose output',
        },
        tools: { 
          type: 'array', 
          description: 'Agent tools',
        },
        max_iterations: { 
          type: 'number', 
          description: 'Maximum iterations',
        },
        config: { 
          type: 'object', 
          description: 'Agent configuration',
        },
        llm_config: { 
          type: ['string', 'object'], 
          description: 'LLM configuration',
        },
        custom_field: { 
          type: 'string', 
          description: 'Custom field',
          validator: (value: any) => value.startsWith('custom-')
        },
      }
    };

    it('should validate required fields', () => {
      // Arrange
      const validator = createValidator(mockSchema);
      
      // Act - Missing required field 'role'
      const result = validator({ name: 'TestAgent' });
      
      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('role');
      expect(result.errors[0].message).toContain('Missing required field');
      expect(result.errors[0].severity).toBe('error');
    });

    it('should succeed when all required fields are present', () => {
      // Arrange
      const validator = createValidator(mockSchema);
      
      // Act
      const result = validator({ 
        name: 'TestAgent', 
        role: 'Tester',
      });
      
      // Assert
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate field types', () => {
      // Arrange
      const validator = createValidator(mockSchema);
      
      // Act - Type mismatch (number instead of string for name)
      const result = validator({ 
        role: 'Tester',
        name: 123, // Should be string
        allow_delegation: 'yes', // Should be boolean
        max_iterations: '10', // Should be number
        tools: {}, // Should be array
      });
      
      console.log('Validation errors:', JSON.stringify(result.errors, null, 2));
      
      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      
      // Test just that there are type validation errors, not specific fields
      // Type errors should be warnings
      expect(result.errors.some(e => e.severity === 'warning')).toBe(true);
      expect(result.errors.some(e => e.message.includes('invalid type'))).toBe(true);
    });

    it('should accept union types', () => {
      // Arrange
      const validator = createValidator(mockSchema);
      
      // Act - Test both string and object for llm_config
      const resultString = validator({ 
        name: 'TestAgent', 
        role: 'Tester',
        llm_config: 'gpt-4'
      });
      
      const resultObject = validator({ 
        name: 'TestAgent', 
        role: 'Tester',
        llm_config: { model: 'gpt-4', temperature: 0.7 }
      });
      
      // Assert
      expect(resultString.valid).toBe(true);
      expect(resultObject.valid).toBe(true);
    });

    it('should run custom validators', () => {
      // Arrange
      const validator = createValidator(mockSchema);
      
      // Act
      const invalidResult = validator({ 
        name: 'TestAgent', 
        role: 'Tester',
        custom_field: 'invalid-value'
      });
      
      const validResult = validator({ 
        name: 'TestAgent', 
        role: 'Tester',
        custom_field: 'custom-value'
      });
      
      // Assert
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors.some(e => e.field === 'custom_field')).toBe(true);
      
      expect(validResult.valid).toBe(true);
    });

    it('should detect fields not in schema', () => {
      // Arrange
      const validator = createValidator(mockSchema);
      
      // Act
      const result = validator({ 
        name: 'TestAgent', 
        role: 'Tester',
        unknown_field: 'some value'
      });
      
      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('unknown_field');
      expect(result.errors[0].message).toContain('Unrecognized field');
      expect(result.errors[0].severity).toBe('error');
    });

    it('should identify fields with incorrect case', () => {
      // Arrange
      const validator = createValidator(mockSchema);
      
      // Act
      const result = validator({ 
        name: 'TestAgent', 
        role: 'Tester',
        // 'Role' instead of 'role' - incorrect case
        Role: 'Developer'
      });
      
      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('Role');
      expect(result.errors[0].message).toContain('incorrect case');
      expect(result.errors[0].severity).toBe('error');
    });
  });
}); 