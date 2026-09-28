import { openDB, IDBPDatabase } from 'idb';
import { SynapNotebook, SynapSource } from '../types/synap';

export interface SynapSourceChunk {
  id: string; // e.g. "chunk-[notebookId]-[sourceId]-[index]"
  notebookId: string;
  sourceId: string;
  sourceTitle: string;
  index: number;
  text: string;
}

const DB_NAME = 'synap-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

export function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('notebooks')) {
          db.createObjectStore('notebooks', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('chunks')) {
          const chunkStore = db.createObjectStore('chunks', { keyPath: 'id' });
          chunkStore.createIndex('by-notebook', 'notebookId');
        }
      },
    });
  }
  return dbPromise;
}

/**
 * Utility to split text into chunks of ~800 characters with an overlap of ~150 characters
 */
export function chunkText(
  notebookId: string,
  sourceId: string,
  sourceTitle: string,
  text: string,
  chunkSize = 800,
  overlap = 150
): SynapSourceChunk[] {
  const chunks: SynapSourceChunk[] = [];
  if (!text) return chunks;

  let start = 0;
  let idx = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunkText = text.slice(start, end);
    
    chunks.push({
      id: `chunk-${notebookId}-${sourceId}-${idx}`,
      notebookId,
      sourceId,
      sourceTitle,
      index: idx,
      text: chunkText,
    });

    idx++;
    if (end === text.length) break;
    start += (chunkSize - overlap);
  }

  return chunks;
}

/**
 * Migration routine: Reads localStorage ('synap:notebooks'), migrates to IndexedDB,
 * splits source text into chunks, removes full-text bloat, and purges the localStorage key.
 */
export async function runStorageMigration(): Promise<void> {
  const localKey = 'synap:notebooks';
  const raw = localStorage.getItem(localKey);
  if (!raw) return;

  try {
    const notebooks: SynapNotebook[] = JSON.parse(raw);
    const db = await getDB();

    for (const nb of notebooks) {
      // Deep copy to modify
      const nbToSave = JSON.parse(JSON.stringify(nb)) as SynapNotebook;
      
      // Clean up metadata
      nbToSave.daysLeft = 0; // Calculated on-the-fly now

      // Extract and chunk source texts
      const chunksToInsert: SynapSourceChunk[] = [];
      
      for (const src of nbToSave.sources) {
        if (src.text) {
          const chunks = chunkText(nb.id, src.id, src.title, src.text);
          chunksToInsert.push(...chunks);
          // Zero out the heavy full-text from the source metadata store
          src.text = '';
        }
      }

      // Save chunks to database
      if (chunksToInsert.length > 0) {
        const tx = db.transaction('chunks', 'readwrite');
        const store = tx.objectStore('chunks');
        for (const chunk of chunksToInsert) {
          await store.put(chunk);
        }
        await tx.done;
      }

      // Save notebook to database
      await db.put('notebooks', nbToSave);
    }

    // Success! Safe to remove the legacy local storage key
    localStorage.removeItem(localKey);
    console.log('IndexedDB Migration completed successfully. Legacy local storage purged.');
  } catch (err) {
    console.error('Failed to run Synap IndexedDB migration:', err);
  }
}

/**
 * Perform simple local keyword / BM25 term frequency matching scorer to retrieve relevant source chunks
 */
export async function retrieveRelevantChunks(
  notebookId: string,
  query: string,
  limit = 6
): Promise<SynapSourceChunk[]> {
  const db = await getDB();
  const tx = db.transaction('chunks', 'readonly');
  const index = tx.objectStore('chunks').index('by-notebook');
  const chunks: SynapSourceChunk[] = await index.getAll(notebookId);
  await tx.done;

  if (!query || chunks.length === 0) {
    return chunks.slice(0, limit);
  }

  const queryTerms = query.toLowerCase().split(/[\s,.\-!?()'"\[\]]+/);
  const scoredChunks = chunks.map((chunk) => {
    const chunkTextLower = chunk.text.toLowerCase();
    let score = 0;

    for (const term of queryTerms) {
      if (term.length < 3) continue; // Skip very short stop terms
      
      // Simple term match count scoring (akin to tf-idf frequency matching)
      let pos = chunkTextLower.indexOf(term);
      while (pos !== -1) {
        score += 1;
        pos = chunkTextLower.indexOf(term, pos + term.length);
      }
    }

    return { chunk, score };
  });

  // Sort descending by score, filtering out chunks with 0 score if other matches exist
  const sorted = scoredChunks
    .filter((sc) => sc.score > 0 || scoredChunks.every((x) => x.score === 0))
    .sort((a, b) => b.score - a.score)
    .map((sc) => sc.chunk);

  return sorted.slice(0, limit);
}
