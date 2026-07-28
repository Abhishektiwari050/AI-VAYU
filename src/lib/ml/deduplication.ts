import { FlaggedNotam } from '../../types';

export interface NotamCluster {
  clusterId: string;
  leadNotam: FlaggedNotam;
  similarNotams: FlaggedNotam[];
  similarityScore: number;
  duplicateCount: number;
}

/**
 * Tokenizes text into lowercase word frequency map for TF-IDF / Cosine Vector calculation
 */
function tokenizeAndVectorize(text: string): Map<string, number> {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2);

  const freq = new Map<string, number>();
  words.forEach((w) => {
    freq.set(w, (freq.get(w) || 0) + 1);
  });

  return freq;
}

/**
 * Computes Cosine Similarity between two term frequency vector maps [0.0 - 1.0]
 */
export function computeCosineSimilarity(vecA: Map<string, number>, vecB: Map<string, number>): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  vecA.forEach((val, key) => {
    normA += val * val;
    if (vecB.has(key)) {
      dotProduct += val * (vecB.get(key) || 0);
    }
  });

  vecB.forEach((val) => {
    normB += val * val;
  });

  if (normA === 0 || normB === 0) return 0;

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Groups redundant or highly overlapping NOTAM strings at the same aerodrome into expandable alert clusters
 */
export function deduplicateNotams(
  notams: FlaggedNotam[],
  similarityThreshold: number = 0.65
): NotamCluster[] {
  const clusters: NotamCluster[] = [];
  const processed = new Set<string>();

  const vectorized = notams.map((n) => ({
    notam: n,
    vector: tokenizeAndVectorize(n.rawText),
  }));

  for (let i = 0; i < vectorized.length; i++) {
    const itemA = vectorized[i];
    if (processed.has(itemA.notam.id)) continue;

    processed.add(itemA.notam.id);
    const similar: FlaggedNotam[] = [];
    let maxSimilarity = 0;

    for (let j = i + 1; j < vectorized.length; j++) {
      const itemB = vectorized[j];
      if (processed.has(itemB.notam.id)) continue;

      const sim = computeCosineSimilarity(itemA.vector, itemB.vector);
      if (sim >= similarityThreshold) {
        similar.push(itemB.notam);
        processed.add(itemB.notam.id);
        if (sim > maxSimilarity) maxSimilarity = sim;
      }
    }

    clusters.push({
      clusterId: `CLUSTER-${itemA.notam.id}`,
      leadNotam: itemA.notam,
      similarNotams: similar,
      similarityScore: Number(maxSimilarity.toFixed(2)),
      duplicateCount: similar.length,
    });
  }

  return clusters;
}
