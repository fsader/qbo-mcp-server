/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/types/**/*.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: 'tsconfig.test.json',
        // ts-jest compiles each test file in isolation and resolves the
        // effective `module` per-file, which makes it spuriously flag top-level
        // `await` (TS1378) in some ESM test modules even though tsconfig.test.json
        // sets `module: ESNext`. The await is genuinely valid here — the tests
        // run as ES modules under NODE_OPTIONS=--experimental-vm-modules — so we
        // suppress only this false-positive diagnostic.
        diagnostics: {
          ignoreCodes: [1378],
        },
      },
    ],
  },
  extensionsToTreatAsEsm: ['.ts'],
  clearMocks: true,
  restoreMocks: true,
};
