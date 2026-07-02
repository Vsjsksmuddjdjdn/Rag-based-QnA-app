export interface MmrCandidate<T> {
  item: T;
  embedding?: number[];
  similarity: number;
}

export function cosineSimilarity(a: number[], b: number[]) {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < Math.min(a.length, b.length); i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function selectMmr<T>(
  queryEmbedding: number[],
  candidates: Array<MmrCandidate<T>>,
  topK: number,
  lambda = 0.65
) {
  const withEmbeddings = candidates.filter((candidate) => candidate.embedding?.length);
  if (withEmbeddings.length < topK) {
    return candidates.slice(0, topK).map((candidate) => candidate.item);
  }

  const selected: Array<MmrCandidate<T>> = [];
  const remaining = [...withEmbeddings];

  while (selected.length < topK && remaining.length) {
    let bestIndex = 0;
    let bestScore = Number.NEGATIVE_INFINITY;

    for (let i = 0; i < remaining.length; i += 1) {
      const candidate = remaining[i];
      const relevance = cosineSimilarity(queryEmbedding, candidate.embedding!);
      const diversityPenalty = selected.length
        ? Math.max(
            ...selected.map((selectedCandidate) =>
              cosineSimilarity(candidate.embedding!, selectedCandidate.embedding!)
            )
          )
        : 0;
      const mmrScore = lambda * relevance - (1 - lambda) * diversityPenalty;
      if (mmrScore > bestScore) {
        bestScore = mmrScore;
        bestIndex = i;
      }
    }

    selected.push(remaining.splice(bestIndex, 1)[0]);
  }

  return selected.map((candidate) => candidate.item);
}
