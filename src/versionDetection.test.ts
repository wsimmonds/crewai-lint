import { detectCrewAIVersion } from './versionDetection';
import * as fs from 'fs/promises';

// Mock the fs module
jest.mock('fs/promises');
const mockedFs = fs as jest.Mocked<typeof fs>;

describe('Version Detection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('detectCrewAIVersion', () => {
    it('should detect version from requirements.txt', async () => {
      // Arrange
      const workspacePath = '/mock/workspace';
      mockedFs.access.mockResolvedValueOnce(undefined); // requirements.txt exists
      mockedFs.readFile.mockResolvedValueOnce('crewai==0.102.5\nsome-other-package==1.0.0');
      
      // Act
      const result = await detectCrewAIVersion(workspacePath);
      
      // Assert
      expect(result).toBe('0.102.0');
      expect(mockedFs.access).toHaveBeenCalledTimes(1);
      expect(mockedFs.readFile).toHaveBeenCalledTimes(1);
    });

    it('should detect version from pyproject.toml', async () => {
      // Arrange
      const workspacePath = '/mock/workspace';
      // Mock requirements.txt doesn't exist
      mockedFs.access.mockRejectedValueOnce(new Error('File not found'));
      // But pyproject.toml exists
      mockedFs.access.mockResolvedValueOnce(undefined);
      mockedFs.readFile.mockResolvedValueOnce(`
[tool.poetry.dependencies]
python = "^3.9"
crewai = "0.103.0"
other = { version = "1.0.0" }
      `);
      
      // Act
      const result = await detectCrewAIVersion(workspacePath);
      
      // Assert
      expect(result).toBe('0.103.0');
      expect(mockedFs.access).toHaveBeenCalledTimes(2);
      expect(mockedFs.readFile).toHaveBeenCalledTimes(1);
    });

    it('should detect version from poetry.lock', async () => {
      // Arrange
      const workspacePath = '/mock/workspace';
      // Mock requirements.txt and pyproject.toml don't exist
      mockedFs.access.mockRejectedValueOnce(new Error('File not found')); // requirements.txt
      mockedFs.access.mockRejectedValueOnce(new Error('File not found')); // pyproject.toml
      // But poetry.lock exists
      mockedFs.access.mockResolvedValueOnce(undefined);
      mockedFs.readFile.mockResolvedValueOnce(`
[[package]]
name = "some-package"
version = "1.0.0"

[[package]]
name = "crewai"
version = "0.104.7"
      `);
      
      // Act
      const result = await detectCrewAIVersion(workspacePath);
      
      // Assert
      expect(result).toBe('0.104.0');
      expect(mockedFs.access).toHaveBeenCalledTimes(3);
      expect(mockedFs.readFile).toHaveBeenCalledTimes(1);
    });

    it('should return "latest" when no version is found', async () => {
      // Arrange
      const workspacePath = '/mock/workspace';
      // Mock no files exist
      mockedFs.access.mockRejectedValueOnce(new Error('File not found')); // requirements.txt
      mockedFs.access.mockRejectedValueOnce(new Error('File not found')); // pyproject.toml
      mockedFs.access.mockRejectedValueOnce(new Error('File not found')); // poetry.lock
      
      // Act
      const result = await detectCrewAIVersion(workspacePath);
      
      // Assert
      expect(result).toBe('latest');
      expect(mockedFs.access).toHaveBeenCalledTimes(3);
      expect(mockedFs.readFile).not.toHaveBeenCalled();
    });

    it('should handle different version formats', async () => {
      const workspacePath = '/mock/workspace';
      
      // Test case 1: ~= format
      jest.clearAllMocks();
      mockedFs.access.mockResolvedValueOnce(undefined);
      mockedFs.readFile.mockResolvedValueOnce('crewai~=0.9.2');
      
      let result = await detectCrewAIVersion(workspacePath);
      expect(result).toBe('0.9.0');
      
      // Test case 2: >= format
      jest.clearAllMocks();
      mockedFs.access.mockResolvedValueOnce(undefined);
      mockedFs.readFile.mockResolvedValueOnce('crewai>=0.10.5');
      
      result = await detectCrewAIVersion(workspacePath);
      expect(result).toBe('0.10.0');
      
      // Test case 3: <= format
      jest.clearAllMocks();
      mockedFs.access.mockResolvedValueOnce(undefined);
      mockedFs.readFile.mockResolvedValueOnce('crewai<=0.11.0');
      
      result = await detectCrewAIVersion(workspacePath);
      expect(result).toBe('0.11.0');
      
      // Test case 4: > format
      jest.clearAllMocks();
      mockedFs.access.mockResolvedValueOnce(undefined);
      mockedFs.readFile.mockResolvedValueOnce('crewai>0.12.3');
      
      result = await detectCrewAIVersion(workspacePath);
      expect(result).toBe('0.12.0');
    });

    it('should handle errors gracefully', async () => {
      // Arrange
      const workspacePath = '/mock/workspace';
      mockedFs.access.mockResolvedValueOnce(undefined);
      mockedFs.readFile.mockRejectedValueOnce(new Error('Some error'));
      
      // Mock console.error to prevent output during tests
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      try {
        // Act
        const result = await detectCrewAIVersion(workspacePath);
        
        // Assert
        expect(result).toBe('latest');
        expect(console.error).toHaveBeenCalled();
      } finally {
        // Restore original console.error
        console.error = originalConsoleError;
      }
    });
  });
}); 