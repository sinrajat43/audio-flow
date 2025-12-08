# AudioFlow Architecture

## Adapter Pattern Implementation

AudioFlow uses the **Adapter Pattern** to abstract external API calls, allowing seamless switching between mock and real implementations without changing business logic.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Controllers Layer                       │
│  (HTTP Request Handlers - transcription, azure-transcription)│
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                      Services Layer                          │
│  (Business Logic - AudioService, AzureSpeechService)         │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                      Adapters Layer                          │
│  (Abstract External Dependencies)                            │
│                                                              │
│  ┌──────────────────────┐    ┌──────────────────────┐      │
│  │  IHttpClient         │    │  ISpeechClient       │      │
│  │  (Interface)         │    │  (Interface)         │      │
│  └──────┬──────┬────────┘    └──────┬──────┬────────┘      │
│         │      │                     │      │               │
│    ┌────▼──┐ ┌─▼────┐          ┌────▼──┐ ┌─▼────┐         │
│    │ Real  │ │ Mock │          │ Real  │ │ Mock │         │
│    │ HTTP  │ │ HTTP │          │ Azure │ │Speech│         │
│    │Client │ │Client│          │Speech │ │Client│         │
│    └───────┘ └──────┘          └───────┘ └──────┘         │
└─────────────────────────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                   External Services                          │
│  (Real HTTP APIs, Azure Cognitive Services)                  │
└─────────────────────────────────────────────────────────────┘
```

## Key Components

### 1. Adapter Interfaces

#### `IHttpClient` Interface

```typescript
interface IHttpClient {
  get(url: string, config?: HttpRequestConfig): Promise<HttpResponse>;
  head(url: string, config?: HttpRequestConfig): Promise<HttpResponse>;
  post(url: string, data?: any, config?: HttpRequestConfig): Promise<HttpResponse>;
}
```

**Implementations:**

- **`RealHttpClient`**: Uses axios for actual HTTP requests
- **`MockHttpClient`**: Returns simulated responses without network calls

#### `ISpeechClient` Interface

```typescript
interface ISpeechClient {
  isConfigured(): boolean;
  transcribe(audioData: Buffer, language: LanguageCode): Promise<SpeechRecognitionResult>;
}
```

**Implementations:**

- **`RealSpeechClient`**: Uses Azure Cognitive Services Speech SDK
- **`MockSpeechClient`**: Returns mock transcriptions in multiple languages

### 2. Adapter Factory

The `src/adapters/index.ts` file acts as a factory that creates the appropriate adapter instances:

```typescript
// Automatically selects implementation based on environment
export const httpClient = createHttpClient(); // Mock in test, Real otherwise
export const speechClient = createSpeechClient(); // Real if Azure configured, Mock otherwise
```

**Selection Logic:**

- **HTTP Client**:
  - Test environment → MockHttpClient
  - Otherwise → RealHttpClient

- **Speech Client**:
  - Azure credentials configured → RealSpeechClient
  - No credentials → MockSpeechClient

### 3. Service Layer

Services consume adapters through interfaces, making them **agnostic** to implementation details.

#### AudioService

```typescript
export class AudioService {
  constructor(private client: IHttpClient = httpClient) {}

  async downloadAudio(audioUrl: string): Promise<AudioDownloadResult> {
    // Works with both Mock and Real HTTP clients
    const response = await this.client.get(audioUrl, { ... });
    return { success: true, data: response.data, ... };
  }
}
```

#### AzureSpeechService

```typescript
export class AzureSpeechService {
  constructor(private client: ISpeechClient = speechClient) {}

  async transcribeAudio(audioUrl: string, language: LanguageCode): Promise<TranscriptionResponse> {
    // Works with both Mock and Real Speech clients
    const audioResult = await audioService.downloadAudio(audioUrl);
    const result = await this.client.transcribe(audioResult.data, language);
    return { transcription: result.text, ... };
  }
}
```

## Benefits of This Architecture

### 1. **Single Responsibility**

Each component has one clear purpose:

- Controllers: Handle HTTP requests
- Services: Implement business logic
- Adapters: Abstract external dependencies

### 2. **Open/Closed Principle**

- Open for extension: Easy to add new adapters (e.g., Google Speech, AWS Transcribe)
- Closed for modification: Services don't change when adding new implementations

### 3. **Dependency Inversion**

- High-level services depend on abstractions (interfaces)
- Low-level implementations depend on the same abstractions
- Services don't depend on concrete implementations

### 4. **Testability**

```typescript
// Easy to test with mock dependencies
const mockClient = new MockHttpClient();
const audioService = new AudioService(mockClient);
// No actual HTTP requests made in tests
```

### 5. **No Code Duplication**

- Services have a single code path
- Same logic handles both mock and real scenarios
- No `if (isMock)` conditions scattered throughout

### 6. **Seamless Switching**

Switch between implementations by:

- Changing environment variables
- Providing/removing Azure credentials
- Setting NODE_ENV to 'test'

No code changes required!

## How Mock Responses Match Real Ones

### HTTP Client

**Real Implementation:**

```typescript
const response = await axios.get(url);
return {
  status: response.status,
  headers: response.headers,
  data: response.data,
};
```

**Mock Implementation:**

```typescript
await sleep(100); // Simulate network delay
return {
  status: 200,
  headers: { 'content-type': 'audio/mpeg' },
  data: generateMockAudioBuffer(),
};
```

**Result:** Services receive identical response structure!

### Speech Client

**Real Implementation:**

```typescript
const recognizer = new sdk.SpeechRecognizer(config, audioConfig);
// ... Azure SDK logic
return { text: transcription, language, confidence };
```

**Mock Implementation:**

```typescript
await sleep(500); // Simulate processing
return {
  text: 'This is a mock transcription in English...',
  language: 'en-US',
  confidence: 0.95,
};
```

**Result:** Services receive identical SpeechRecognitionResult!

## Directory Structure

```
src/
├── adapters/
│   ├── index.ts                    # Factory & exports
│   ├── http-client.interface.ts   # HTTP client interface
│   ├── http-client.real.ts        # Real HTTP implementation
│   ├── http-client.mock.ts        # Mock HTTP implementation
│   ├── speech-client.interface.ts # Speech client interface
│   ├── speech-client.real.ts      # Azure Speech implementation
│   └── speech-client.mock.ts      # Mock Speech implementation
├── services/
│   ├── audio.service.ts            # Uses IHttpClient
│   ├── transcription.service.ts    # Uses AudioService
│   └── azure-speech.service.ts     # Uses ISpeechClient
└── ...
```

## Usage Examples

### Default Behavior (Auto-Selected)

```typescript
// Services automatically use the right adapter
const result = await transcriptionService.transcribeAudio(url);
// Uses MockHttpClient in tests, RealHttpClient otherwise

const azure = await azureSpeechService.transcribeAudio(url, 'en-US');
// Uses RealSpeechClient if Azure configured, MockSpeechClient otherwise
```

### Custom Injection (Testing)

```typescript
// Inject specific implementation for testing
const mockHttp = new MockHttpClient();
const audioService = new AudioService(mockHttp);

const mockSpeech = new MockSpeechClient();
const azureService = new AzureSpeechService(mockSpeech);
```

### Force Real Implementation

```typescript
// Force real HTTP even in tests
const realHttp = new RealHttpClient();
const audioService = new AudioService(realHttp);
```

## Configuration

The adapter selection is controlled by:

### Environment Variables

```bash
NODE_ENV=test              # → MockHttpClient
NODE_ENV=development       # → RealHttpClient
NODE_ENV=production        # → RealHttpClient

AZURE_SPEECH_KEY=xxx       # → RealSpeechClient
AZURE_SPEECH_REGION=xxx    # (if both set)

# If Azure not configured → MockSpeechClient
```

### Factory Logic

```typescript
// src/adapters/index.ts
function createHttpClient(): IHttpClient {
  return config.app.isTest ? new MockHttpClient() : new RealHttpClient();
}

function createSpeechClient(): ISpeechClient {
  return config.azure.isConfigured ? new RealSpeechClient() : new MockSpeechClient();
}
```

## Adding New Adapters

To add a new external service (e.g., Google Speech):

### 1. Create Interface

```typescript
// src/adapters/google-speech-client.interface.ts
export interface IGoogleSpeechClient {
  transcribe(audio: Buffer, language: string): Promise<TranscriptResult>;
}
```

### 2. Create Implementations

```typescript
// src/adapters/google-speech-client.real.ts
export class RealGoogleSpeechClient implements IGoogleSpeechClient {
  async transcribe(audio: Buffer, language: string): Promise<TranscriptResult> {
    // Use @google-cloud/speech SDK
  }
}

// src/adapters/google-speech-client.mock.ts
export class MockGoogleSpeechClient implements IGoogleSpeechClient {
  async transcribe(audio: Buffer, language: string): Promise<TranscriptResult> {
    return { text: 'Mock Google transcription...' };
  }
}
```

### 3. Update Factory

```typescript
// src/adapters/index.ts
function createGoogleSpeechClient(): IGoogleSpeechClient {
  return config.google.isConfigured ? new RealGoogleSpeechClient() : new MockGoogleSpeechClient();
}

export const googleSpeechClient = createGoogleSpeechClient();
```

### 4. Use in Services

```typescript
// src/services/google-speech.service.ts
export class GoogleSpeechService {
  constructor(private client: IGoogleSpeechClient = googleSpeechClient) {}

  async transcribe(url: string) {
    const audio = await audioService.downloadAudio(url);
    return await this.client.transcribe(audio.data, 'en-US');
  }
}
```

**No changes needed to existing code!**

## Best Practices

### 1. **Keep Interfaces Minimal**

Only include methods actually needed by services.

### 2. **Match Response Structures**

Mock responses should have identical structure to real responses.

### 3. **Simulate Delays**

Mock implementations should simulate network delays for realistic testing.

### 4. **Use Dependency Injection**

Always accept adapters through constructor, with default factory-created instance.

### 5. **Log Adapter Selection**

Log which implementation is being used at startup for debugging.

## Testing Strategy

### Unit Tests

```typescript
describe('AudioService', () => {
  it('should download audio', async () => {
    const mockClient = new MockHttpClient();
    const service = new AudioService(mockClient);

    const result = await service.downloadAudio('https://example.com/audio.mp3');
    expect(result.success).toBe(true);
    // No actual HTTP request made!
  });
});
```

### Integration Tests

```typescript
describe('Transcription Flow', () => {
  it('should transcribe audio end-to-end', async () => {
    // Uses mock adapters automatically in test environment
    const result = await azureSpeechService.transcribeAudio(url, 'en-US');
    expect(result.transcription).toBeDefined();
  });
});
```

## Migration from Old Code

**Before (Mixed Responsibilities):**

```typescript
async mockDownload(url: string) {
  if (isMock) {
    return { success: true, data: mockData };
  } else {
    return await axios.get(url);
  }
}
```

**After (Single Responsibility):**

```typescript
async downloadAudio(url: string) {
  // Always same logic, adapter handles mock vs real
  const response = await this.client.get(url);
  return { success: true, data: response.data };
}
```

## Summary

The Adapter Pattern in AudioFlow provides:

- ✅ Clean separation of concerns
- ✅ Easy testing with no network dependencies
- ✅ Seamless switching between mock and real implementations
- ✅ No code changes when adding new external services
- ✅ Type-safe interfaces throughout
- ✅ Single source of truth for external API interactions

This architecture makes the codebase more maintainable, testable, and extensible!
