import { SchemaManager } from './schemaManager';
import { detectCrewAIVersion } from './versionDetection';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock dependencies
jest.mock('./versionDetection');
jest.mock('fs/promises');

// Create mock schema
const mockSchema = {
  version: '0.102.0',
  agentSchema: {
    requiredFields: ['name', 'role'],
    optionalFields: {
      name: { type: 'string', description: 'Agent name' },
      role: { type: 'string', description: 'Agent role' },
      goal: { type: 'string', description: 'Agent goal' }
    }
  },
  taskSchema: {
    requiredFields: ['name', 'description'],
    optionalFields: {
      name: { type: 'string', description: 'Task name' },
      description: { type: 'string', description: 'Task description' },
      expected_output: { type: 'string', description: 'Expected output' }
    }
  },
  validateAgent: jest.fn().mockReturnValue({ valid: true, errors: [] }),
  validateTask: jest.fn().mockReturnValue({ valid: true, errors: [] })
};

// Mock module import for schemas
jest.mock('./schemas/0.102.0/index', () => ({
  schema: mockSchema
}), { virtual: true });

describe('SchemaManager', () => {
  let schemaManager: SchemaManager;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup fs mocks for loadSchemas
    (fs.readdir as jest.Mock).mockResolvedValue(['0.102.0']);
    
    // Create fresh instance for each test
    schemaManager = new SchemaManager();
  });
  
  describe('initialization', () => {
    it('should load available schemas on construction', () => {
      // Arrange & Act already done in beforeEach
      
      // Assert
      expect(fs.readdir).toHaveBeenCalled();
      
      // Force loadSchemas to complete (it's called in constructor)
      return new Promise(process.nextTick).then(() => {
        expect(schemaManager.getAvailableVersions()).toContain('0.102.0');
      });
    });
  });
  
  describe('setVersionFromWorkspace', () => {
    it('should set version based on workspace detection', async () => {
      // Arrange
      const mockWorkspacePath = '/mock/workspace';
      const mockVersion = '0.102.0';
      (detectCrewAIVersion as jest.Mock).mockResolvedValue(mockVersion);
      
      // Act
      await schemaManager.setVersionFromWorkspace(mockWorkspacePath);
      
      // Assert
      expect(detectCrewAIVersion).toHaveBeenCalledWith(mockWorkspacePath);
      
      // This test assumes getCurrentSchema exposes the current version
      // We need to wait for constructor's loadSchemas to complete
      return new Promise(process.nextTick).then(() => {
        const schema = schemaManager.getCurrentSchema();
        expect(schema).toBeDefined();
        expect(schema.version).toBe(mockVersion);
      });
    });
  });
  
  describe('getCurrentSchema', () => {
    it('should return the current schema based on version', async () => {
      // Arrange - wait for loadSchemas to complete
      await new Promise(process.nextTick);
      schemaManager.setCurrentVersion('0.102.0');
      
      // Act
      const schema = schemaManager.getCurrentSchema();
      
      // Assert
      expect(schema).toBeDefined();
      expect(schema.version).toBe('0.102.0');
    });
    
    it('should fallback to latest if version not found', async () => {
      // Arrange - wait for loadSchemas to complete
      await new Promise(process.nextTick);
      schemaManager.setCurrentVersion('non-existent-version');
      
      // Act
      const schema = schemaManager.getCurrentSchema();
      
      // Assert
      expect(schema).toBeDefined();
      // It should fall back to one of the available schemas
      expect(schemaManager.getAvailableVersions()).toContain(schema.version);
    });
  });
  
  describe('validateAgent', () => {
    it('should validate agent config against schema', async () => {
      // Arrange - wait for loadSchemas to complete
      await new Promise(process.nextTick);
      schemaManager.setCurrentVersion('0.102.0');
      const mockAgentData = { name: 'TestAgent', role: 'Tester' };
      
      // Reset the mock to ensure we get fresh calls
      mockSchema.validateAgent.mockClear();
      
      // Act
      const result = schemaManager.validateAgent(mockAgentData);
      
      // Assert
      expect(mockSchema.validateAgent).toHaveBeenCalledWith(mockAgentData);
      expect(result.valid).toBe(true);
    });
    
    it('should return error if no schema available', async () => {
      // Arrange - wait for loadSchemas to complete
      await new Promise(process.nextTick);
      // Set up the manager to have no schemas
      jest.spyOn(schemaManager, 'getCurrentSchema').mockReturnValue(undefined as any);
      
      // Act
      const result = schemaManager.validateAgent({});
      
      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain('No schema available');
    });
  });
  
  describe('validateTask', () => {
    it('should validate task config against schema', async () => {
      // Arrange - wait for loadSchemas to complete
      await new Promise(process.nextTick);
      schemaManager.setCurrentVersion('0.102.0');
      const mockTaskData = { name: 'TestTask', description: 'Test description' };
      
      // Reset the mock to ensure we get fresh calls
      mockSchema.validateTask.mockClear();
      
      // Act
      const result = schemaManager.validateTask(mockTaskData);
      
      // Assert
      expect(mockSchema.validateTask).toHaveBeenCalledWith(mockTaskData);
      expect(result.valid).toBe(true);
    });
  });
  
  describe('getAvailableVersions', () => {
    it('should return a list of available schema versions', async () => {
      // Arrange - wait for loadSchemas to complete
      await new Promise(process.nextTick);
      
      // Act
      const versions = schemaManager.getAvailableVersions();
      
      // Assert
      expect(versions).toContain('0.102.0');
      expect(versions).not.toContain('latest'); // "latest" should be filtered out
    });
  });
  
  describe('setCurrentVersion', () => {
    it('should set the current version', async () => {
      // Arrange - wait for loadSchemas to complete
      await new Promise(process.nextTick);
      const newVersion = '0.102.0';
      
      // Act
      schemaManager.setCurrentVersion(newVersion);
      
      // Assert
      expect(schemaManager.getCurrentSchema().version).toBe(newVersion);
    });
  });
}); 