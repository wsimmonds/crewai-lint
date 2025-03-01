import { createValidator } from './index';
import { AgentSchemaDefinition, TaskSchemaDefinition } from '../types/schema';
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';

describe('YAML Validation', () => {
  const taskSchema: TaskSchemaDefinition = {
    requiredFields: ["description", "expected_output"],
    optionalFields: {
      agent: { 
        type: ["string", "object"], 
        description: "The agent responsible for executing the task." 
      }
    }
  };

  it('should correctly validate task with multi-line strings', () => {
    // This is a simplified version of the YAML provided by the user
    const yamlContent = `
profile_user:
  description: >
    This is just a test
    Not a real one
    Only as an example
  agent: user_profiler
  expected_output: >
    This is just a multiline
    expected output
    Don't ever use this in reality
`;

    // Parse the YAML with type assertion
    const parsedYaml = yaml.load(yamlContent) as { 
      profile_user: { 
        description: string; 
        agent: string; 
        expected_output: string;
      } 
    };
    
    // Get the validator for tasks
    const validator = createValidator(taskSchema);
    
    // Validate the parsed data
    const result = validator(parsedYaml.profile_user);
    
    // Should not have any errors
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should validate nested tasks structure correctly', () => {
    // This matches how the extension would process an entire tasks.yaml file
    const yamlContent = `
profile_user:
  description: >
    This is just a test
    Not a real one
    Only as an example
  agent: user_profiler
  expected_output: >
    This is just a multiline
    expected output
    Don't ever use this in reality

describe_user:
  description: >
    Create a description of the user.
  agent: course_builder
  expected_output: >
    A description of the user - this is just a unit test and a very badly written one at that too. Ignore it!
`;

    // Parse the YAML with type assertion
    const parsedYaml = yaml.load(yamlContent) as Record<string, any>;
    
    // The extension is likely validating each top-level entry as a separate task
    const validator = createValidator(taskSchema);
    
    // Validate and print results for each task
    for (const [taskName, taskConfig] of Object.entries(parsedYaml)) {
      const result = validator(taskConfig);
      
      // Each task should be valid
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    }
  });
});

describe('Utils', () => {
  describe('createValidator', () => {
    it('should validate a real YAML file with case sensitivity', () => {
      // Only run this test if the test file exists
      const testFilePath = path.join(__dirname, '../../test/agents.yaml');
      if (!fs.existsSync(testFilePath)) {
        console.log('Test file not found, skipping test');
        return;
      }
      
      // Load the schema
      const mockAgentSchema: AgentSchemaDefinition = {
        requiredFields: ['role', 'goal', 'backstory'],
        optionalFields: {
          name: { type: 'string', description: 'Agent name' },
          role: { type: 'string', description: 'Agent role' },
          goal: { type: 'string', description: 'Agent goal' },
          backstory: { type: 'string', description: 'Agent backstory' },
          llm: { type: ['string', 'object'], description: 'Language model' },
          tools: { type: 'array', description: 'Agent tools' }
        }
      };
      
      // Load the YAML file
      const yamlContent = fs.readFileSync(testFilePath, 'utf8');
      const data = yaml.load(yamlContent) as Record<string, any>;
      
      // Get the agent config (first entry in the YAML)
      const agentName = Object.keys(data)[0];
      const agentConfig = data[agentName];
      
      // Validate using our validator
      const validator = createValidator(mockAgentSchema);
      const result = validator(agentConfig);
      
      // We expect validation to fail because of case sensitivity
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'LLM' && e.message.includes('incorrect case'))).toBe(true);
    });
  });
}); 