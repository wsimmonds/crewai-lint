module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!**/*.test.ts',
    '!**/node_modules/**',
  ],
  coverageReporters: ['text', 'lcov'],
  testTimeout: 10000, // Increased timeout for VS Code extension tests
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
  },
  moduleNameMapper: {
    '^vscode$': '<rootDir>/test/vscode-mock.js'
  },
  modulePathIgnorePatterns: ['<rootDir>/out/'],
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
}; 