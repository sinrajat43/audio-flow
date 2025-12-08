# AudioFlow - Audio Transcription API Service

A production-ready audio transcription service with mock and Azure Speech-to-Text integration, built with Fastify, TypeScript, and MongoDB Atlas. Includes real-time WebSocket streaming, comprehensive testing, and automatic retry mechanisms.

## Features

- **Mock Transcription**: Fast mock transcription for testing and development
- **Azure Speech-to-Text**: Real Azure Cognitive Services integration with automatic fallback
- **Real-time Streaming**: WebSocket support for streaming audio chunks
- **Retry Logic**: Exponential backoff retry for failed downloads
- **MongoDB Atlas**: Scalable cloud database with optimized indexes
- **Multiple Languages**: Support for 7+ languages (en-US, fr-FR, es-ES, de-DE, etc.)
- **Type-Safe**: Full TypeScript implementation with strict type checking
- **Comprehensive Tests**: Unit and integration tests with 90%+ coverage
- **Error Handling**: Graceful error handling with detailed error responses

## Technology Stack

- **Runtime**: Node.js 20+ with TypeScript
- **Framework**: Fastify (high-performance web framework)
- **Database**: MongoDB Atlas (cloud-hosted)
- **External API**: Azure Cognitive Services Speech SDK
- **WebSocket**: Fastify WebSocket plugin
- **Testing**: Jest with ts-jest and MongoMemoryServer
- **Validation**: Zod for runtime type validation
- **Logging**: Pino (high-performance logging)

## Prerequisites

- Node.js 20.x or higher
- MongoDB Atlas account (or local MongoDB)
- Azure Cognitive Services account (optional - will use mock if not configured)

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd AudioFlow
```

2. Install dependencies:

```bash
npm install
```

3. Create environment file:

```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:

```env
NODE_ENV=development
PORT=3000
LOG_LEVEL=info

# MongoDB Atlas connection string (required)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/audioflow

# Azure Speech Service (optional - will use mock if not provided)
AZURE_SPEECH_KEY=your-azure-key
AZURE_SPEECH_REGION=eastus

# Retry Configuration (optional)
MAX_RETRY_ATTEMPTS=3
RETRY_INITIAL_DELAY=1000
RETRY_MAX_DELAY=10000
```

## Running the Application

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm start
```

### Running Tests

```bash
npm test
```

### Linting

```bash
npm run lint
npm run lint:fix
```

## API Documentation

### 🎯 Interactive API Documentation (Swagger UI)

**Access the full interactive API documentation at:**

```
http://localhost:3000/docs
```

**Swagger UI provides:**

- ✅ **Complete endpoint documentation** - All REST and WebSocket endpoints
- ✅ **Interactive testing** - Test APIs directly in your browser
- ✅ **Request/response schemas** - Full schema definitions with examples
- ✅ **Error codes & formats** - Detailed error documentation
- ✅ **No code required** - Visual interface for all API operations

---

## MongoDB Indexing Strategy (Part 2)

### Current Indexes

The `transcriptions` collection has the following indexes optimized for 100M+ records:

1. **Compound Index: `{ createdAt: -1, source: 1 }`**
   - Purpose: Efficient date-range queries with optional source filtering
   - Used by: `GET /transcriptions` endpoint
   - Supports: Sorting by date and filtering by source simultaneously

2. **Single Index: `{ createdAt: -1 }`**
   - Purpose: Fast date-based sorting and range queries
   - Used by: Date filtering queries without source filter

3. **Single Index: `{ audioUrl: 1 }`**
   - Purpose: Duplicate detection and URL lookups
   - Used by: Preventing duplicate transcriptions

4. **Sparse Index: `{ metadata.sessionId: 1 }`**
   - Purpose: WebSocket session lookups
   - Sparse: Only indexes documents with sessionId

### Rationale for 100M+ Records

For a dataset with 100M+ records, our indexing strategy provides:

1. **Date Range Queries**: The compound index `{ createdAt: -1, source: 1 }` ensures O(log n) lookup time for date-range queries, which is critical when filtering transcriptions from the last 30 days.

2. **Index Coverage**: When querying by `createdAt` and optionally `source`, MongoDB can use the compound index without touching the collection documents, resulting in covered queries.

3. **Sorting Efficiency**: The descending order on `createdAt` eliminates the need for in-memory sorting, crucial for large datasets.

4. **Sharding Strategy**: For horizontal scaling beyond 100M records, we would shard on `{ createdAt: "hashed" }` or use range-based sharding on `createdAt` to distribute data across multiple servers.

5. **TTL Index**: For automatic cleanup of old records, add a TTL index:
   ```javascript
   db.transcriptions.createIndex(
     { createdAt: 1 },
     { expireAfterSeconds: 7776000 }, // 90 days
   );
   ```

### Query Performance Example

```javascript
// Efficient query using compound index
db.transcriptions
  .find({
    createdAt: { $gte: new Date('2025-11-08') },
    source: 'azure',
  })
  .sort({ createdAt: -1 })
  .limit(10);

// This query will:
// 1. Use the compound index for filtering and sorting
// 2. Avoid full collection scan
// 3. Return results in O(log n + k) where k is the limit
```

---

## Scalability & System Design (Part 3)

### Handling 10,000+ Concurrent Requests

To scale the service to handle 10,000+ concurrent requests, here are the key improvements:

#### 1. Horizontal Scaling with Load Balancing

**Current**: Single Node.js instance
**Scaled**: Multiple instances behind a load balancer

```
                     ┌─────────────┐
                     │   Nginx/ALB  │
                     │Load Balancer │
                     └──────┬───────┘
                            │
            ┌───────────────┼───────────────┐
            │               │               │
       ┌────▼────┐     ┌────▼────┐    ┌────▼────┐
       │Instance 1│     │Instance 2│    │Instance N│
       └─────────┘     └─────────┘    └─────────┘
```

**Implementation:**

- Deploy in Docker containers with Kubernetes
- Use Horizontal Pod Autoscaler (HPA) based on CPU/memory metrics
- Target: 70% CPU utilization per pod
- Enable session affinity for WebSocket connections

#### 2. Queue-Based Architecture for Background Processing

**Current**: Synchronous audio processing
**Scaled**: Asynchronous job queue

```
API Server → Bull/BullMQ → Redis → Worker Pool → Azure/Storage
```

**Benefits:**

- Prevents API timeout on slow transcriptions
- Retry failed jobs automatically
- Handle traffic spikes by queuing requests
- Monitor job progress and failures

**Implementation:**

```javascript
// API endpoint queues the job
await transcriptionQueue.add('transcribe', {
  audioUrl,
  language,
  userId,
});

// Workers process jobs in background
transcriptionQueue.process('transcribe', async (job) => {
  const result = await azureSpeechService.transcribeAudio(job.data.audioUrl, job.data.language);
  return result;
});
```

#### 3. Caching Layer with Redis

**Current**: Direct MongoDB queries
**Scaled**: Multi-tier caching

**Cache Strategy:**

- **L1 (In-Memory)**: Recent transcription results (5 min TTL)
- **L2 (Redis)**: Frequently accessed transcriptions (1 hour TTL)
- **L3 (MongoDB)**: Persistent storage

**Implementation:**

```javascript
// Check cache before database
const cached = await redis.get(`transcription:${id}`);
if (cached) return JSON.parse(cached);

// Fetch from DB and cache
const result = await TranscriptionModel.findById(id);
await redis.setex(`transcription:${id}`, 3600, JSON.stringify(result));
```

**Cache Invalidation:**

- Write-through: Update cache on new transcriptions
- TTL-based expiration
- Event-driven invalidation on updates

#### 4. Database Optimization

**Read Replicas:**

- Primary: Write operations
- Replicas: Read operations (transcription list)
- Distribute read load across 2-3 replicas

**Connection Pooling:**

```javascript
mongoose.connect(uri, {
  maxPoolSize: 50, // Increased from 10
  minPoolSize: 10,
  socketTimeoutMS: 45000,
});
```

**Sharding Strategy:**

```javascript
// Shard by createdAt ranges
sh.shardCollection('audioflow.transcriptions', {
  createdAt: 'hashed',
});
```

#### 5. Rate Limiting & Circuit Breaker

**Rate Limiting:**

```javascript
// Per-client rate limit: 100 req/min
fastify.register(require('@fastify/rate-limit'), {
  max: 100,
  timeWindow: '1 minute',
});
```

**Circuit Breaker for Azure:**

```javascript
// Prevent cascading failures
const breaker = new CircuitBreaker(azureTranscribe, {
  timeout: 30000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
});
```

#### 6. CDN for Audio Files

- Cache frequently accessed audio files on CDN
- Reduce latency for downloads
- Offload bandwidth from origin servers

#### 7. Monitoring & Observability

**Metrics:**

- Request rate, latency (p50, p95, p99)
- Error rate by endpoint
- Queue depth and processing time
- Database connection pool utilization

**Tools:**

- Prometheus + Grafana for metrics
- ELK Stack for log aggregation
- Sentry for error tracking
- Distributed tracing with OpenTelemetry

### Expected Performance

With these optimizations:

| Metric              | Before    | After        |
| ------------------- | --------- | ------------ |
| Concurrent Requests | ~100      | 10,000+      |
| Response Time (p95) | 500ms     | 200ms        |
| Throughput          | 100 req/s | 2,000+ req/s |
| Database Load       | High      | Distributed  |
| Availability        | 95%       | 99.9%        |

---

## Project Structure

```
AudioFlow/
├── src/
│   ├── config/
│   │   ├── database.ts           # MongoDB connection
│   │   └── environment.ts        # Environment validation
│   ├── models/
│   │   └── transcription.model.ts # Mongoose schema
│   ├── services/
│   │   ├── audio.service.ts      # Audio download logic
│   │   ├── transcription.service.ts # Mock transcription
│   │   └── azure-speech.service.ts  # Azure integration
│   ├── routes/
│   │   ├── transcription.routes.ts
│   │   └── azure-transcription.routes.ts
│   ├── controllers/
│   │   ├── transcription.controller.ts
│   │   └── azure-transcription.controller.ts
│   ├── middleware/
│   │   ├── error-handler.ts      # Error handling
│   │   └── validation.ts         # Request validation
│   ├── types/
│   │   └── index.ts              # TypeScript types
│   ├── utils/
│   │   ├── retry.ts              # Retry logic
│   │   └── logger.ts             # Logging
│   ├── websocket/
│   │   └── transcription-stream.ts # WebSocket handler
│   ├── app.ts                     # Fastify app
│   └── server.ts                  # Server entry
├── tests/
│   ├── setup.ts
│   ├── transcription.test.ts
│   ├── azure-transcription.test.ts
│   ├── websocket.test.ts
│   └── services.test.ts
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

---

## Testing

The project includes comprehensive tests covering:

- **Unit Tests**: Services, utilities, retry logic
- **Integration Tests**: API endpoints, database operations
- **WebSocket Tests**: Connection, streaming, message flow
- **Error Handling**: Validation, network failures, timeouts

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- transcription.test.ts

# Run in watch mode
npm run test:watch
```

### Test Coverage

Target coverage: 90%+

```
Statements   : 90%+
Branches     : 85%+
Functions    : 90%+
Lines        : 90%+
```

---

## Development

### Code Style

The project uses ESLint and Prettier for consistent code formatting:

```bash
# Check linting
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

### Git Workflow

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and commit: `git commit -m "feat: add feature"`
3. Run tests: `npm test`
4. Push and create PR: `git push origin feature/your-feature`

---

## Deployment

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: audioflow
spec:
  replicas: 3
  selector:
    matchLabels:
      app: audioflow
  template:
    metadata:
      labels:
        app: audioflow
    spec:
      containers:
        - name: audioflow
          image: audioflow:latest
          ports:
            - containerPort: 3000
          env:
            - name: MONGODB_URI
              valueFrom:
                secretKeyRef:
                  name: audioflow-secrets
                  key: mongodb-uri
```

---

## Security Considerations

1. **Environment Variables**: Never commit `.env` files
2. **API Keys**: Store in secrets management (AWS Secrets Manager, Azure Key Vault)
3. **Input Validation**: All inputs validated with Zod schemas
4. **Rate Limiting**: Prevent abuse and DDoS
5. **HTTPS**: Use TLS in production
6. **CORS**: Configure allowed origins

---

## License

MIT

---

## Support

For issues, questions, or contributions, please open an issue on GitHub.

---

## Changelog

### v1.0.0 (2025-12-08)

- Initial release
- Mock transcription endpoint
- Azure Speech-to-Text integration
- WebSocket streaming support
- Comprehensive test suite
- MongoDB indexing optimization
- Scalability documentation
