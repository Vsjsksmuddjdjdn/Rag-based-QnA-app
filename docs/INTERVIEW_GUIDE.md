# Interview Guide

## How to Explain the Project

This is a full-stack RAG document Q&A application. Users upload documents into collections. The backend extracts text, splits it into chunks, embeds the chunks, stores them in Chroma, and retrieves relevant chunks when the user asks a question. The LLM receives only the retrieved context and must answer with citations.

## Concepts Demonstrated

- Retrieval-Augmented Generation
- Embeddings
- Vector databases
- Semantic search
- MMR retrieval
- Prompt engineering
- Streaming responses
- REST API design
- React state management
- TypeScript full-stack development
- Error handling and validation
- Practical AI application architecture

## Strong Interview Answers

### What problem does RAG solve?

RAG lets an LLM answer questions using external or private knowledge that was not part of its training data. Instead of fine-tuning the model for every document, we retrieve relevant chunks and include them in the prompt.

### Why not send the whole document to the LLM?

Large documents can exceed context limits, increase cost, and reduce answer quality. Chunking and retrieval send only the most relevant context.

### What are embeddings?

Embeddings are numeric vectors that represent semantic meaning. Similar text produces vectors close together in vector space, which enables semantic search.

### Why use a vector database?

A vector database stores embeddings and supports nearest-neighbor search efficiently. In this project, Chroma retrieves document chunks similar to the user question.

### Why chunk documents?

Chunking creates searchable units of meaning. Good chunk size balances context completeness with retrieval precision.

### What is chunk overlap?

Overlap repeats a small part of neighboring chunks so facts near boundaries are not lost.

### What is MMR?

Maximal Marginal Relevance selects chunks that are both relevant and diverse. It helps avoid returning five nearly identical chunks.

### How does the app reduce hallucinations?

It retrieves source chunks, sends only those chunks to the LLM, instructs the model to answer only from context, and requires citations. If context is missing, the assistant says it does not know.

### Why include citations?

Citations make answers verifiable. Users can inspect the filename, page number when available, and snippet used to produce the answer.

### Why Express and TypeScript?

Express keeps the backend approachable while TypeScript adds type safety across controllers, services, RAG modules, and API contracts.

### Why local JSON storage?

For a portfolio project, local JSON avoids native SQLite setup issues while still preserving metadata and chat history. The storage module can later be replaced with SQLite or PostgreSQL.

### How would you make this production-ready?

I would add authentication, background indexing jobs, persistent SQL storage, file scanning, OCR, rate limiting, observability, retry queues, and automated RAG evaluation.

## Walkthrough Script

1. Open the app and create a collection.
2. Upload a PDF or Markdown file.
3. Point out status transitions: parsing, indexing, ready.
4. Ask a question whose answer is in the document.
5. Show citations and retrieved context.
6. Ask something not in the document and show the "I do not know" behavior.
7. Toggle MMR and top-k to explain retrieval quality.
8. Open backend folders and explain route/controller/service/RAG separation.

## Common Follow-up Questions

### How do you handle corrupted files?

The loader catches parser failures and marks the document as failed with a clear message.

### What happens if Chroma is down?

Indexing and retrieval return structured errors. The frontend also shows a vector database health warning.

### What happens if the OpenAI key is missing?

Embedding and chat services throw a typed `OPENAI_API_KEY_MISSING` error with setup guidance.

### Can Claude be added?

Yes. The backend has a chat provider interface. A Claude provider can implement the same `generate` method and be selected through config.

### Can Pinecone be used?

Yes. The vector store abstraction includes a Pinecone adapter selected with `VECTOR_PROVIDER=pinecone`.

### How do tests help?

Tests cover API validation, collection behavior, upload failure handling, no-document chat behavior, and chunk metadata preservation. More tests can mock embeddings and Chroma to verify full indexing.

## Limitations to Admit Honestly

- Scanned PDFs need OCR.
- Local JSON is not ideal for concurrent production users.
- Current reranking is MMR, not a learned reranker.
- There is no auth yet.
- It depends on external LLM and embedding APIs.

## Resume Bullet Ideas

- Built a full-stack RAG document Q&A app using React, Express, LangChain.js, OpenAI embeddings, and Chroma.
- Implemented document ingestion for PDF, DOCX, TXT, and Markdown with chunking, metadata preservation, vector indexing, and citation-based chat.
- Added streaming grounded answers, MMR retrieval, structured errors, upload validation, and backend tests.
