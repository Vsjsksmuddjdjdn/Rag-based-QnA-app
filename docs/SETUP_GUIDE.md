# Setup Guide

## Prerequisites

- Node.js 20 or newer
- pnpm
- Docker Desktop, for local Chroma
- OpenAI API key

## Environment Variables

Copy the sample file:

```bash
cp .env.example .env
```

Important variables:

| Variable | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | Required for embeddings and answer generation |
| `OPENAI_CHAT_MODEL` | Chat model, default `gpt-4o-mini` |
| `OPENAI_EMBEDDING_MODEL` | Embedding model, default `text-embedding-3-small` |
| `VECTOR_PROVIDER` | `chroma` by default, `pinecone` optional |
| `CHROMA_HOST` / `CHROMA_PORT` | Local Chroma server |
| `DEFAULT_TOP_K` | Number of chunks retrieved by default |
| `CHUNK_SIZE` / `CHUNK_OVERLAP` | Chunking controls |
| `MAX_CONTEXT_CHARS` | Caps context sent to the LLM |
| `MAX_UPLOAD_MB` | Upload size limit |

## Install

```bash
pnpm install
```

## Run Chroma

```bash
docker compose up chroma
```

Chroma listens on `http://localhost:8000`.

## Run Backend

```bash
pnpm --filter backend dev
```

Backend listens on `http://localhost:4000`.

Check health:

```bash
curl http://localhost:4000/api/health
```

## Run Frontend

```bash
pnpm --filter frontend dev
```

Frontend listens on `http://localhost:5173`.

## Run Tests

```bash
pnpm test
```

## Build

```bash
pnpm build
```

## Example Usage Flow

1. Create a collection named `Resume Research`.
2. Upload a PDF, DOCX, TXT, or Markdown document.
3. Wait for status to become `ready`.
4. Ask: `What are the main projects mentioned?`
5. Open the citation drawer to inspect source snippets.
6. Toggle MMR retrieval and compare source diversity.

## Troubleshooting

### Missing API Key

Symptom: upload or chat fails with `OPENAI_API_KEY_MISSING`.

Fix: add a valid key to `.env` and restart the backend.

### Chroma Unavailable

Symptom: health check shows vector database warning or upload fails with `VECTOR_DB_UNAVAILABLE`.

Fix:

```bash
docker compose up chroma
```

### Empty Document

Symptom: upload result says no readable text found.

Fix: use a text-based PDF/DOCX or OCR the scanned file before upload.

### CORS Error

Symptom: frontend cannot reach backend.

Fix: confirm `FRONTEND_URL=http://localhost:5173` and restart backend.

### Port Already Used

Change `PORT` for backend or Vite port in `frontend/vite.config.ts`.
