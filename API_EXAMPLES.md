# AudioFlow API Examples

This document provides practical examples for using the AudioFlow API.

## Base URL

```
http://localhost:3000
```

## Authentication

Currently, no authentication is required (add in production).

---

## 1. Health Check

Check if the service is running.

### cURL

```bash
curl http://localhost:3000/health
```

### JavaScript (fetch)

```javascript
const response = await fetch('http://localhost:3000/health');
const data = await response.json();
console.log(data);
```

### Response

```json
{
  "status": "healthy",
  "timestamp": "2025-12-08T10:30:00.000Z",
  "uptime": 123.45,
  "environment": "development",
  "azure": {
    "configured": true
  }
}
```

---

## 2. Create Mock Transcription

Generate a mock transcription from an audio URL.

### cURL

```bash
curl -X POST http://localhost:3000/transcription \
  -H "Content-Type: application/json" \
  -d '{
    "audioUrl": "https://example.com/sample.mp3"
  }'
```

### JavaScript (fetch)

```javascript
const response = await fetch('http://localhost:3000/transcription', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    audioUrl: 'https://example.com/sample.mp3'
  })
});

const data = await response.json();
console.log('Transcription ID:', data.id);
console.log('Transcription:', data.transcription);
```

### Python

```python
import requests

response = requests.post(
    'http://localhost:3000/transcription',
    json={'audioUrl': 'https://example.com/sample.mp3'}
)

data = response.json()
print(f"ID: {data['id']}")
print(f"Transcription: {data['transcription']}")
```

### Response

```json
{
  "id": "507f1f77bcf86cd799439011",
  "audioUrl": "https://example.com/sample.mp3",
  "transcription": "This is a mock transcription of the audio file: sample.mp3...",
  "source": "mock",
  "createdAt": "2025-12-08T10:30:00.000Z"
}
```

---

## 3. Get Recent Transcriptions

Fetch transcriptions from the last N days.

### cURL - Basic

```bash
curl http://localhost:3000/transcriptions
```

### cURL - With Parameters

```bash
curl "http://localhost:3000/transcriptions?days=7&page=1&limit=5&source=azure"
```

### JavaScript (fetch)

```javascript
// Build query parameters
const params = new URLSearchParams({
  days: '30',
  page: '1',
  limit: '10',
  source: 'azure'  // optional: filter by source
});

const response = await fetch(`http://localhost:3000/transcriptions?${params}`);
const data = await response.json();

console.log(`Total: ${data.count}`);
console.log(`Page: ${data.page} of ${data.totalPages}`);
data.transcriptions.forEach(t => {
  console.log(`- ${t.id}: ${t.transcription.substring(0, 50)}...`);
});
```

### Python

```python
import requests

params = {
    'days': 30,
    'page': 1,
    'limit': 10,
    'source': 'azure'  # optional
}

response = requests.get(
    'http://localhost:3000/transcriptions',
    params=params
)

data = response.json()
print(f"Total: {data['count']}")
for transcription in data['transcriptions']:
    print(f"- {transcription['id']}: {transcription['audioUrl']}")
```

### Response

```json
{
  "count": 150,
  "page": 1,
  "limit": 10,
  "totalPages": 15,
  "transcriptions": [
    {
      "id": "507f1f77bcf86cd799439011",
      "audioUrl": "https://example.com/sample.mp3",
      "transcription": "Transcription text...",
      "source": "azure",
      "language": "en-US",
      "createdAt": "2025-12-08T10:30:00.000Z"
    }
  ]
}
```

---

## 4. Create Azure Transcription

Use Azure Speech-to-Text for real transcription.

### cURL - English

```bash
curl -X POST http://localhost:3000/azure-transcription \
  -H "Content-Type: application/json" \
  -d '{
    "audioUrl": "https://example.com/sample.mp3",
    "language": "en-US"
  }'
```

### cURL - French

```bash
curl -X POST http://localhost:3000/azure-transcription \
  -H "Content-Type: application/json" \
  -d '{
    "audioUrl": "https://example.com/french-audio.mp3",
    "language": "fr-FR"
  }'
```

### JavaScript (fetch)

```javascript
const response = await fetch('http://localhost:3000/azure-transcription', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    audioUrl: 'https://example.com/sample.mp3',
    language: 'en-US'  // optional, defaults to en-US
  })
});

const data = await response.json();
console.log('Source:', data.source);  // 'azure' or 'mock'
console.log('Language:', data.language);
console.log('Transcription:', data.transcription);
```

### Python

```python
import requests

response = requests.post(
    'http://localhost:3000/azure-transcription',
    json={
        'audioUrl': 'https://example.com/sample.mp3',
        'language': 'es-ES'  # Spanish
    }
)

data = response.json()
print(f"Source: {data['source']}")
print(f"Transcription: {data['transcription']}")
```

### Supported Languages

- `en-US` - English (United States)
- `fr-FR` - French (France)
- `es-ES` - Spanish (Spain)
- `de-DE` - German (Germany)
- `it-IT` - Italian (Italy)
- `ja-JP` - Japanese (Japan)
- `ko-KR` - Korean (Korea)

### Response

```json
{
  "id": "507f1f77bcf86cd799439012",
  "audioUrl": "https://example.com/sample.mp3",
  "transcription": "Actual transcribed text from Azure Speech-to-Text service...",
  "source": "azure",
  "language": "en-US",
  "createdAt": "2025-12-08T10:30:00.000Z"
}
```

---

## 5. WebSocket Streaming Transcription

Real-time streaming transcription.

### JavaScript (Browser)

```javascript
const ws = new WebSocket('ws://localhost:3000/ws/transcription');

ws.onopen = () => {
  console.log('Connected to transcription stream');
  
  // Simulate sending audio chunks
  const chunks = [
    'base64-encoded-audio-chunk-1',
    'base64-encoded-audio-chunk-2',
    'base64-encoded-audio-chunk-3'
  ];
  
  chunks.forEach((chunk, index) => {
    setTimeout(() => {
      ws.send(JSON.stringify({
        type: 'chunk',
        data: chunk,
        isLast: index === chunks.length - 1
      }));
    }, index * 1000);  // Send every 1 second
  });
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  switch (message.type) {
    case 'partial':
      console.log(`Partial (${message.confidence}): ${message.text}`);
      break;
      
    case 'final':
      console.log(`Final transcription ID: ${message.id}`);
      console.log(`Text: ${message.text}`);
      ws.close();
      break;
      
    case 'error':
      console.error(`Error: ${message.message} (${message.code})`);
      break;
  }
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('Connection closed');
};
```

### Node.js

```javascript
const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:3000/ws/transcription');

ws.on('open', () => {
  console.log('Connected');
  
  // Send audio chunks
  ws.send(JSON.stringify({
    type: 'chunk',
    data: Buffer.from('audio data').toString('base64'),
    isLast: false
  }));
  
  // Send final chunk
  setTimeout(() => {
    ws.send(JSON.stringify({
      type: 'chunk',
      data: Buffer.from('final audio data').toString('base64'),
      isLast: true
    }));
  }, 2000);
});

ws.on('message', (data) => {
  const message = JSON.parse(data.toString());
  console.log('Received:', message);
});
```

### Python (websockets library)

```python
import asyncio
import websockets
import json
import base64

async def transcribe_stream():
    uri = "ws://localhost:3000/ws/transcription"
    
    async with websockets.connect(uri) as websocket:
        # Send audio chunks
        audio_chunks = [
            b"audio data 1",
            b"audio data 2",
            b"audio data 3"
        ]
        
        for i, chunk in enumerate(audio_chunks):
            message = {
                "type": "chunk",
                "data": base64.b64encode(chunk).decode('utf-8'),
                "isLast": i == len(audio_chunks) - 1
            }
            await websocket.send(json.dumps(message))
            
            # Receive response
            response = await websocket.recv()
            data = json.loads(response)
            
            if data['type'] == 'partial':
                print(f"Partial: {data['text']} ({data['confidence']})")
            elif data['type'] == 'final':
                print(f"Final: {data['text']}")
                print(f"ID: {data['id']}")

asyncio.run(transcribe_stream())
```

### Message Formats

**Client → Server:**
```json
{
  "type": "chunk",
  "data": "<base64-encoded-audio>",
  "isLast": false
}
```

**Server → Client (Partial):**
```json
{
  "type": "partial",
  "text": "Partial transcription...",
  "confidence": 0.85
}
```

**Server → Client (Final):**
```json
{
  "type": "final",
  "text": "Complete transcription text",
  "id": "507f1f77bcf86cd799439013"
}
```

---

## Error Handling

All endpoints return consistent error responses:

### Example Error Response

```json
{
  "error": {
    "code": "INVALID_URL",
    "message": "The provided audio URL is invalid",
    "statusCode": 400
  }
}
```

### Handling Errors in JavaScript

```javascript
try {
  const response = await fetch('http://localhost:3000/transcription', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ audioUrl: 'invalid-url' })
  });
  
  if (!response.ok) {
    const error = await response.json();
    console.error(`Error ${error.error.code}: ${error.error.message}`);
    return;
  }
  
  const data = await response.json();
  console.log('Success:', data);
} catch (error) {
  console.error('Network error:', error);
}
```

---

## Postman Collection

You can import these examples into Postman:

1. Create a new collection named "AudioFlow"
2. Add these requests:
   - GET Health Check: `http://localhost:3000/health`
   - POST Mock Transcription: `http://localhost:3000/transcription`
   - GET Transcriptions: `http://localhost:3000/transcriptions`
   - POST Azure Transcription: `http://localhost:3000/azure-transcription`

---

## Rate Limiting

Currently no rate limiting (add in production).

Recommended limits:
- 100 requests per minute per IP
- 1000 requests per hour per IP

---

## Best Practices

1. **Always check the response status code**
2. **Handle errors gracefully** with try-catch
3. **Use pagination** for listing transcriptions
4. **Close WebSocket connections** when done
5. **Validate audio URLs** before sending
6. **Use appropriate language codes** for Azure

---

## Testing Tips

Use these public audio files for testing:

```
https://file-examples.com/storage/fe83e73857318e55dd66974/2017/11/file_example_MP3_700KB.mp3
https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3
```

---

For more information, see the [README.md](README.md).

