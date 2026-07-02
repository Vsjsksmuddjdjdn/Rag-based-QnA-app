# RAG-based Document Q&A App

A full-stack Retrieval-Augmented Generation project built with React, TypeScript, Vite, Node.js, Express, LangChain.js, OpenAI embeddings/chat models, and Chroma.

The app lets users create document collections, upload PDFs/DOCX/TXT/Markdown files, index them into a vector database, and ask source-grounded questions with citations.

## Features

- Drag-and-drop multi-document upload
- PDF, DOCX, TXT, and Markdown parsing in Node.js
- Chunking with overlap and metadata preservation
- OpenAI embeddings through LangChain.js
- Chroma vector database by default
- Optional Pinecone adapter through config
- Grounded chat with citations and "I do not know" fallback
- Streaming responses with Server-Sent Events
- Collection-specific chat history
- Document deletion and re-indexing
- Polished React workspace with light/dark theme
- Backend validation, structured errors, logging, and tests

## Quick Start

1. Install dependencies:

```bash
pnpm install
```

2. Create environment file:

```bash
cp .env.example .env
```

3. Add your `OPENAI_API_KEY` to `.env`.

4. Start Chroma:

```bash
docker compose up chroma
```

5. Start backend and frontend:

```bash
pnpm dev
```

6. Open the app:

- Frontend: http://localhost:5173
- Backend health: http://localhost:4000/api/health

## Scripts

```bash
pnpm --filter backend dev
pnpm --filter frontend dev
pnpm test
pnpm build
pnpm typecheck
```

## Project Structure

```text
backend/src
  config        environment and logger
  controllers   request/response handlers
  loaders       PDF, DOCX, TXT, Markdown extraction
  middleware    validation, errors, upload handling
  rag           chunking, embeddings, LLM, prompt, vector stores
  routes        REST API route definitions
  services      application workflows
  storage       local JSON metadata store
  types         shared backend domain types
frontend/src
  components    workspace UI pieces
  hooks         data and state hooks
  lib           typed API client
  pages         main workspace page
  styles        Tailwind CSS
  types         frontend domain types
docs            setup, API, architecture, interview notes
```

## Documentation

- [Setup Guide](./docs/SETUP_GUIDE.md)
- [Technical Documentation](./docs/TECHNICAL_DOCUMENTATION.md)
- [API Reference](./docs/API_REFERENCE.md)
- [Interview Guide](./docs/INTERVIEW_GUIDE.md)

## Known Limitations

- An OpenAI API key is required for real embedding and answer generation.
- Local Chroma must be running for indexing and retrieval.
- PDF page-level citations depend on extractable PDF text.
- The local JSON store is intentionally simple for portfolio/demo use.
