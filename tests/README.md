# AudioFlow Tests

This directory contains all automated tests for the AudioFlow project, organized into **Unit Tests** and **Integration Tests**.

## 📁 Test Structure

```
tests/
├── unit/                    # Unit Tests (UT)
│   └── services.test.ts     # Service layer and utility tests
├── integration/             # Integration Tests (IT)
│   ├── transcription.test.ts       # Mock transcription API tests
│   ├── azure-transcription.test.ts # Azure transcription API tests
│   └── websocket.test.ts          # WebSocket streaming tests
├── setup.ts                 # Test environment setup
└── README.md                # This file
```

## 🧪 Test Types

### Unit Tests (`tests/unit/`)

Test individual components in isolation without external dependencies.

**Location**: `tests/unit/`

**What's tested**:

- Service functions (audioService, transcriptionService)
- Utility functions (retry logic, URL validation)
- Pure business logic

**Characteristics**:

- ✅ Fast execution (< 1s per test)
- ✅ No database or network calls
- ✅ Mock all external dependencies
- ✅ Focus on individual function behavior

**Example**:

```typescript
// tests/unit/services.test.ts
it('should validate correct URLs', () => {
  expect(isValidUrl('https://example.com')).toBe(true);
});
```

### Integration Tests (`tests/integration/`)

Test complete API workflows with real database connections (in-memory).

**Location**: `tests/integration/`

**What's tested**:

- Complete API endpoint flows
- Database operations (with MongoMemoryServer)
- Request/response handling
- WebSocket connections

**Characteristics**:

- ⏱️ Slower execution (may take several seconds)
- ✅ Use in-memory MongoDB
- ✅ Test full request-response cycle
- ✅ Verify database persistence

**Example**:

```typescript
// tests/integration/transcription.test.ts
it('should create a transcription', async () => {
  const response = await app.inject({
    method: 'POST',
    url: '/transcription',
    payload: { audioUrl: 'https://example.com/audio.mp3' },
  });
  expect(response.statusCode).toBe(201);
});
```

## 🚀 Running Tests

### Run All Tests

```bash
npm test
```

### Run Only Unit Tests

```bash
npm run test:unit
```

### Run Only Integration Tests

```bash
npm run test:integration
```

### Watch Mode (Run on File Changes)

```bash
# All tests
npm run test:watch

# Unit tests only
npm run test:unit:watch

# Integration tests only
npm run test:integration:watch
```

### Run Specific Test File

```bash
# Unit test
npm test -- tests/unit/services.test.ts

# Integration test
npm test -- tests/integration/transcription.test.ts
```

### Run Without Coverage

```bash
npm test -- --no-coverage
```

## 📊 Test Coverage

Current coverage: **~83%**

Coverage goals:

- Statements: ≥ 70%
- Branches: ≥ 30%
- Functions: ≥ 60%
- Lines: ≥ 70%

**View coverage report**:

```bash
npm test
open coverage/index.html
```

## 📝 Test Files

### Unit Tests (16 tests)

**`tests/unit/services.test.ts`**

- Audio service tests
- Transcription service tests
- Retry utility tests
- URL validation tests

### Integration Tests (23 tests)

**`tests/integration/transcription.test.ts`** (11 tests)

- POST /transcription endpoint
- GET /transcriptions endpoint
- Pagination and filtering
- Error handling

**`tests/integration/azure-transcription.test.ts`** (7 tests)

- POST /azure-transcription endpoint
- Multi-language support
- Azure/mock fallback
- Validation

**`tests/integration/websocket.test.ts`** (5 tests)

- WebSocket connection lifecycle
- Audio chunk processing
- Partial and final results
- Error handling

## 🛠️ Test Configuration

### Jest Configuration

Located in `jest.config.js` at project root.

**Key settings**:

- Uses `ts-jest` for TypeScript support
- `MongoMemoryServer` for in-memory database
- Project-based organization (unit vs integration)
- Coverage thresholds enforced

### Test Setup

Located in `tests/setup.ts`.

**What it does**:

- Starts MongoDB in-memory server
- Sets NODE_ENV to 'test'
- Configures test environment variables
- Global setup and teardown

## ✍️ Writing New Tests

### Adding a Unit Test

1. Create file in `tests/unit/` directory
2. Import the module to test
3. Mock external dependencies
4. Test individual functions

```typescript
// tests/unit/my-service.test.ts
import { myFunction } from '../../src/services/my-service';

describe('MyService', () => {
  it('should do something', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });
});
```

### Adding an Integration Test

1. Create file in `tests/integration/` directory
2. Import `createApp` from `../../src/app`
3. Use `app.inject()` to test endpoints
4. Clean up database in `afterEach`

```typescript
// tests/integration/my-endpoint.test.ts
import { createApp } from '../../src/app';
import { FastifyInstance } from 'fastify';

describe('My Endpoint', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should work', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/my-endpoint',
    });
    expect(response.statusCode).toBe(200);
  });
});
```

## 🔍 Debugging Tests

### Run Single Test

```bash
npm test -- -t "test name pattern"
```

### Verbose Output

```bash
npm test -- --verbose
```

### Show Console Logs

```bash
npm test -- --silent=false
```

### Debug in VS Code

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache"],
  "console": "integratedTerminal"
}
```

## 📚 Best Practices

### ✅ Do

- Write tests for new features before implementing
- Keep tests focused on one thing
- Use descriptive test names
- Clean up database after each test
- Mock external API calls
- Test both success and error cases

### ❌ Don't

- Make actual HTTP requests to external APIs
- Rely on test execution order
- Leave database in dirty state
- Write tests that depend on each other
- Test implementation details, test behavior
- Skip error case testing

## 🐛 Troubleshooting

### Tests Hanging

```bash
npm test -- --forceExit
```

### MongoDB Connection Issues

```bash
# Clear MongoMemoryServer cache
rm -rf node_modules/.cache/mongodb-memory-server
npm test
```

### Import Path Issues

After moving test files, update import paths:

- Use `../../src/` for files in `unit/` or `integration/`
- Use `../setup` for setup file

### Port Already in Use

Tests use random ports, but if issues persist:

```bash
lsof -ti:3000 | xargs kill -9
```

## 📈 Coverage Reports

After running `npm test`, coverage reports are generated in:

- `coverage/lcov-report/index.html` - HTML report (human-readable)
- `coverage/lcov.info` - LCOV format (for CI tools)
- `coverage/coverage-final.json` - JSON format

## 🤝 Contributing

When adding new features:

1. **Write tests first** (TDD approach)
2. **Categorize correctly**: Unit vs Integration
3. **Update this README** if adding new test files
4. **Ensure tests pass** before committing
5. **Maintain coverage** above thresholds

## 📞 Support

For testing questions:

- Check Jest documentation: https://jestjs.io
- Review existing tests for examples
- See main project README for project overview

---

**Total Tests**: 39  
**Unit Tests**: 16  
**Integration Tests**: 23  
**Coverage**: ~83%  
**Status**: ✅ All Passing
