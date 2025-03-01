// This file will run before each test
import * as path from 'path';

// Mock the fs/promises module
jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
  readdir: jest.fn(),
  access: jest.fn()
}));

// Define a global utility function for resolving test paths
global.testPath = (relativePath: string) => {
  return path.join('/mock/workspace', relativePath);
};

// Add the testPath function to the global types
declare global {
  function testPath(relativePath: string): string;
}

// Clear all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
}); 