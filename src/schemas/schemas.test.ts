import { schema as schema_0_102_0 } from './0.102.0';

describe('Schemas', () => {
  describe('Schema 0.102.0', () => {
    it('should export the correct version', () => {
      // Assert
      expect(schema_0_102_0.version).toBe('0.102.0');
    });
    
    describe('Agent Schema', () => {
      it('should validate a valid agent configuration', () => {
        // Arrange
        const validAgent = {
          role: 'Developer',
          goal: 'Build a robust application',
          backstory: 'Senior developer with 10 years of experience',
          verbose: true,
          allow_delegation: false,
          tools: ['coding', 'debugging']
        };
        
        // Act
        const result = schema_0_102_0.validateAgent(validAgent);
        
        // Assert
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
      
      it('should reject an invalid agent configuration', () => {
        // Arrange
        const invalidAgent = {
          // Missing required fields role and goal
          name: 'TestAgent',
          tools: 'coding' // Wrong type, should be an array
        };
        
        // Act
        const result = schema_0_102_0.validateAgent(invalidAgent);
        
        // Assert
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        
        // Should have errors for missing required fields
        expect(result.errors.some(e => e.field === 'role')).toBe(true);
        expect(result.errors.some(e => e.field === 'goal')).toBe(true);
        
        // Should have error for wrong type
        expect(result.errors.some(e => e.field === 'tools')).toBe(true);
      });
      
      it('should include all required fields in schema', () => {
        // Assert
        expect(schema_0_102_0.agentSchema.requiredFields).toContain('role');
        expect(schema_0_102_0.agentSchema.requiredFields).toContain('goal');
        expect(schema_0_102_0.agentSchema.requiredFields).toContain('backstory');
        
        // Check field definitions for optional fields that actually exist
        expect(schema_0_102_0.agentSchema.optionalFields.llm).toBeDefined();
        expect(schema_0_102_0.agentSchema.optionalFields.tools).toBeDefined();
      });
    });
    
    describe('Task Schema', () => {
      it('should validate a valid task configuration', () => {
        // Arrange
        const validTask = {
          name: 'BuildFeature',
          description: 'Build a new feature for the app',
          expected_output: 'Working feature with tests',
          agent: 'DeveloperAgent',
          async_execution: true
        };
        
        // Act
        const result = schema_0_102_0.validateTask(validTask);
        
        // Assert
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
      
      it('should reject an invalid task configuration', () => {
        // Arrange
        const invalidTask = {
          // Missing required field 'description'
          name: 'BuildFeature',
          agent: ['DeveloperAgent'] // Wrong type, should be string
        };
        
        // Act
        const result = schema_0_102_0.validateTask(invalidTask);
        
        // Assert
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        
        // Should have error for missing required field
        expect(result.errors.some(e => e.field === 'description')).toBe(true);
        
        // Should have errors for wrong types
        expect(result.errors.some(e => e.field === 'agent')).toBe(true);
      });
      
      it('should include all required fields in schema', () => {
        // Assert
        expect(schema_0_102_0.taskSchema.requiredFields).toContain('description');
        expect(schema_0_102_0.taskSchema.requiredFields).toContain('expected_output');
        
        // Check field definitions for optional fields that actually exist
        expect(schema_0_102_0.taskSchema.optionalFields.name).toBeDefined();
        expect(schema_0_102_0.taskSchema.optionalFields.agent).toBeDefined();
        expect(schema_0_102_0.taskSchema.optionalFields.tools).toBeDefined();
        
        // Also verify that required fields have descriptions for documentation purposes
        expect(schema_0_102_0.taskSchema.optionalFields.description).toBeDefined();
        expect(schema_0_102_0.taskSchema.optionalFields.expected_output).toBeDefined();
      });
    });
  });
}); 