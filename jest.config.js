module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/server.ts',
    // Exclude real adapters from coverage - they require actual external services
    '!src/adapters/http-client.real.ts',
    '!src/adapters/speech-client.real.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  verbose: true,
  testTimeout: 30000,
  maxWorkers: 1,
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 30,
      functions: 60,
      lines: 70,
    },
  },
};

