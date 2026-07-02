# API Reference

Base URL: `http://localhost:4000/api`

All responses use JSON except streaming chat, which uses Server-Sent Events.

## Health

### GET `/health`

Returns backend and vector database status.

```json
{
  "ok": true,
  "service": "rag-document-qa-backend",
  "vector": {
    "ok": true,
    "provider": "chroma"
  }
}
```

## Collections

### GET `/collections`

Returns collections with document and chunk counts.

### POST `/collections`

Body:

```json
{
  "name": "Research Papers",
  "description": "Optional note"
}
```

Validation:

- `name`: 2 to 80 characters
- duplicate names return `409`

## Documents

### POST `/documents/upload`

Multipart form fields:

- `collectionId`: target collection id
- `documents`: one or more files

Supported files:

- `.pdf`
- `.docx`
- `.txt`
- `.md` / `.markdown`

Response:

```json
{
  "results": [
    {
      "ok": true,
      "filename": "paper.pdf",
      "document": {
        "id": "doc_...",
        "status": "ready",
        "chunkCount": 12
      }
    }
  ],
  "successCount": 1,
  "failureCount": 0
}
```

Validation handled:

- missing collection
- empty file
- unsupported type
- duplicate filename within a collection
- parser failures
- vector database failures
- missing OpenAI API key

### GET `/documents?collectionId=...`

Returns documents, optionally filtered by collection.

### DELETE `/documents/:id`

Deletes document metadata, chunks, stored file, and vector records.

### POST `/documents/:id/reindex`

Re-parses the stored file, rebuilds chunks, regenerates embeddings, and replaces vector records.

### GET `/documents/:id/chunks`

Returns stored chunks for inspection/debugging.

## Chat

### POST `/chat`

Body:

```json
{
  "collectionId": "col_...",
  "message": "What does the document say about caching?",
  "topK": 5,
  "temperature": 0.2,
  "model": "gpt-4o-mini",
  "retrievalMode": "similarity",
  "showContext": true,
  "stream": false
}
```

Response:

```json
{
  "answer": "The document describes caching as... [S1]",
  "citations": [
    {
      "id": "S1",
      "filename": "system-design.md",
      "pageNumber": 3,
      "snippet": "Caching reduces repeated database reads...",
      "score": 0.82
    }
  ],
  "retrievedContext": []
}
```

Rules:

- If no indexed documents exist, the assistant says it does not know.
- If retrieval returns no useful context, the assistant says it does not know.
- The prompt instructs the LLM to answer only from retrieved context.

### Streaming Chat

Set `"stream": true`.

Events:

```text
event: token
data: {"token":"The"}

event: done
data: {"answer":"...","citations":[...]}

event: error
data: {"message":"..."}
```

### GET `/chat/history/:collectionId`

Returns ordered chat messages for a collection.

### DELETE `/chat/history/:collectionId`

Clears collection chat history.
