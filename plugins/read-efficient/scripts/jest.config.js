export const preset = 'ts-jest';
export const testEnvironment = 'node';
export const roots = ['<rootDir>/tests'];
export const testMatch = ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'];
export const moduleFileExtensions = ['ts', 'js', 'json'];
export const collectCoverageFrom = ['src/**/*.ts', '!src/**/*.d.ts'];
export const coverageThreshold = { global: { branches: 85, functions: 85, lines: 85, statements: 85 } };