import { GoogleGenAI } from '@google/genai';
import { SynapNotebook, SynapSource, SynapStudyItem, SynapProviderConfig } from '../types/synap';
import { getDB, chunkText, retrieveRelevantChunks } from './synapDatabase';

const STORAGE_KEY_PROVIDER = 'synap:provider';
const STORAGE_KEY_ACTIVE = 'synap:active_notebook_id';

let cachedNotebooks: SynapNotebook[] = [];

export const synapService = {
  /**
   * Retrieves active notebook ID from localStorage
   */
  getActiveNotebookId(): string | null {
    return localStorage.getItem(STORAGE_KEY_ACTIVE);
  },

  /**
   * Saves active notebook ID to localStorage
   */
  setActiveNotebookId(id: string | null): void {
    if (id) {
      localStorage.setItem(STORAGE_KEY_ACTIVE, id);
    } else {
      localStorage.removeItem(STORAGE_KEY_ACTIVE);
    }
  },

  /**
   * Load notebooks synchronously from in-memory cache (useful for instant renders)
   */
  loadNotebooksSync(): SynapNotebook[] {
    return cachedNotebooks;
  },

  /**
   * Load all notebooks asynchronously from IndexedDB
   */
  async loadNotebooks(): Promise<SynapNotebook[]> {
    const db = await getDB();
    const list = await db.getAll('notebooks');
    cachedNotebooks = list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return cachedNotebooks;
  },

  /**
   * Saves a single notebook asynchronously in IndexedDB
   */
  async saveNotebook(notebook: SynapNotebook): Promise<void> {
    const db = await getDB();
    await db.put('notebooks', notebook);
    const idx = cachedNotebooks.findIndex((n) => n.id === notebook.id);
    if (idx !== -1) {
      cachedNotebooks[idx] = notebook;
    } else {
      cachedNotebooks.push(notebook);
    }
    cachedNotebooks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  /**
   * Delete a notebook and all associated chunks asynchronously
   */
  async deleteNotebook(id: string): Promise<void> {
    const db = await getDB();
    // 1. Delete notebook record
    await db.delete('notebooks', id);
    
    // 2. Delete associated chunks
    const tx = db.transaction('chunks', 'readwrite');
    const store = tx.objectStore('chunks');
    const index = store.index('by-notebook');
    const chunks = await index.getAllKeys(id);
    for (const key of chunks) {
      await store.delete(key);
    }
    await tx.done;

    cachedNotebooks = cachedNotebooks.filter((n) => n.id !== id);

    if (this.getActiveNotebookId() === id) {
      this.setActiveNotebookId(null);
    }
  },

  /**
   * Create a new notebook asynchronously in IndexedDB
   */
  async createNotebook(title: string, courseCode: string, examDateStr?: string): Promise<SynapNotebook> {
    const id = `nb-${Date.now()}`;
    const newNb: SynapNotebook = {
      id,
      title,
      courseCode: courseCode || 'GEN-ST',
      track: 'Self-Paced Plan',
      examDate: examDateStr || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days out default
      daysLeft: 14,
      readiness: 0,
      masteredCount: 0,
      weakCount: 0,
      sourceCount: 0,
      createdAt: new Date().toISOString(),
      sources: [],
      chat: [],
      studyItems: [],
      topicTree: [],
    };
    await this.saveNotebook(newNb);
    this.setActiveNotebookId(id);
    return newNb;
  },

  /**
   * Add a source document asynchronously, chunk its content, and save to database
   */
  async addSourceToNotebook(notebookId: string, title: string, type: 'pdf' | 'slides' | 'notes' | 'text', text: string): Promise<SynapSource> {
    const db = await getDB();
    const nb: SynapNotebook | undefined = await db.get('notebooks', notebookId);
    if (!nb) throw new Error('Notebook not found');

    const sourceId = `src-${Date.now()}`;
    const cleanTitle = title.trim();
    
    // Split full text into chunks & store in DB
    const chunks = chunkText(notebookId, sourceId, cleanTitle, text);
    if (chunks.length > 0) {
      const tx = db.transaction('chunks', 'readwrite');
      const store = tx.objectStore('chunks');
      for (const ch of chunks) {
        await store.put(ch);
      }
      await tx.done;
    }

    // Build light source descriptor (with zeroed text to keep metadata light)
    const newSource: SynapSource = {
      id: sourceId,
      title: cleanTitle,
      type,
      text: '', // No longer stored inside metadata to avoid localStorage/IndexDB bloat!
      addedAt: new Date().toLocaleDateString(),
      wordCount: `${text.split(/\s+/).filter(Boolean).length} words`,
      badge: type.toUpperCase(),
    };

    nb.sources = [...(nb.sources || []), newSource];
    nb.sourceCount = nb.sources.length;

    // Build default topic tree from source title
    const topicNode = {
      id: `topic-${Date.now()}`,
      name: cleanTitle,
      progress: 0,
    };
    nb.topicTree = [...(nb.topicTree || []), topicNode];

    await this.saveNotebook(nb);
    return newSource;
  },

  /**
   * Add new study items to a notebook
   */
  async addStudyItems(notebookId: string, items: SynapStudyItem[]): Promise<void> {
    const db = await getDB();
    const nb: SynapNotebook | undefined = await db.get('notebooks', notebookId);
    if (!nb) return;

    nb.studyItems = [...(nb.studyItems || []), ...items];
    await this.saveNotebook(nb);
  },

  getProvider(): SynapProviderConfig {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PROVIDER);
      if (raw) return JSON.parse(raw);
    } catch {}
    return {
      type: 'gemini',
      model: 'gemini-3.8-flash',
      key: '',
    };
  },

  saveProvider(provider: SynapProviderConfig): void {
    try {
      localStorage.setItem(STORAGE_KEY_PROVIDER, JSON.stringify(provider));
    } catch (e) {
      console.warn(e);
    }
  },

  /**
   * Query the AI with BM25 keyword chunked retrieval from database
   */
  async queryGroundedAI(
    notebookId: string,
    prompt: string,
    systemInstruction = ''
  ): Promise<string> {
    const db = await getDB();
    const nb: SynapNotebook | undefined = await db.get('notebooks', notebookId);
    if (!nb || !nb.sources || nb.sources.length === 0) {
      return "This notebook has no indexed document sources yet. Upload notes, PDFs, or slides using 'Add Doc / PDF' to enable grounded AI answers.";
    }

    // Retrieve relevant chunks matching query using TF-IDF term frequencies
    const relevantChunks = await retrieveRelevantChunks(notebookId, prompt, 6);
    if (relevantChunks.length === 0) {
      return "Your sources don't cover this well enough to formulate a reliable response. Please upload notes directly addressing this subject.";
    }

    const provider = this.getProvider();
    
    // Construct rich text-grounding context from retrieved chunks
    const context = relevantChunks
      .map((c) => `--- SOURCE CHUNK: ${c.sourceTitle} (Index: ${c.index}) ---\n${c.text}`)
      .join('\n\n');

    const fullPrompt = `Below are the most relevant, retrieved snippets from the student's courses:\n${context}\n\nStudent Inquiry:\n${prompt}\n\nInstructions:\nAnswer the question accurately, concisely, and ground it strictly in the retrieved source text. If a detail cannot be found in these sources, state clearly that the sources do not specify. Cite specific sources by title.`;

    const sysInstructionClean = systemInstruction || "You are Synap, an encouraging and rigorous cognitive study companion. You cite sources clearly and help students build permanent mental models.";

    // 1. If Gemini
    if (provider.type === 'gemini') {
      const key = provider.key || '';
      if (!key) {
        throw new Error('Google Gemini key is not configured. Please provide an API key in Synap Settings.');
      }
      const ai = new GoogleGenAI({ apiKey: key });
      const resp = await ai.models.generateContent({
        model: provider.model || 'gemini-3.8-flash',
        contents: fullPrompt,
        config: {
          systemInstruction: sysInstructionClean,
          temperature: 0.3,
        },
      });
      return resp.text || 'Grounded synthexis completed based on your course sources.';
    }

    // 2. If Anthropic
    if (provider.type === 'anthropic' && provider.key) {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': provider.key,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: provider.model || 'claude-3-5-sonnet-20241022',
          max_tokens: 1500,
          system: sysInstructionClean,
          messages: [{ role: 'user', content: fullPrompt }],
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      return data.content.map((b: any) => b.text || '').join('\n');
    }

    // 3. Default OpenAI-compatible
    const base = (provider.baseUrl || 'https://api.openai.com/v1').replace(/\/$/, '');
    const res = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${provider.key}`,
      },
      body: JSON.stringify({
        model: provider.model || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: sysInstructionClean },
          { role: 'user', content: fullPrompt },
        ],
        temperature: 0.3,
      }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data.choices?.[0]?.message?.content || '';
  },

  /**
   * Automatically generate customized study items from the course materials
   */
  async generateItems(
    notebookId: string,
    type: 'flashcard' | 'quiz'
  ): Promise<SynapStudyItem[]> {
    const provider = this.getProvider();
    
    // Gather a composite set of chunks to construct representative prompts
    const relevantChunks = await retrieveRelevantChunks(notebookId, "important definitions core facts", 12);
    if (relevantChunks.length === 0) {
      throw new Error('Please upload notes or course materials to extract flashcards from.');
    }

    const context = relevantChunks
      .map((c) => `--- Snippet from ${c.sourceTitle} ---\n${c.text}`)
      .join('\n\n');

    const prompt = type === 'flashcard'
      ? `Based on these snippets, generate 5 high-quality flashcards for active study. Return a strict JSON array only, with no markdown wrappers or extra commentary. Structure: [{"prompt": "conceptual question", "answer": "precise answer explanation", "topic": "specific topic name", "vulnerability": "moderate", "reference": "verbatim citation"}]. Snippets:\n${context}`
      : `Based on these snippets, generate 4 multi-choice quiz questions. Return a strict JSON array only, with no markdown wrappers or extra commentary. Structure: [{"prompt": "clear question", "options": ["Option A", "Option B", "Option C", "Option D"], "correctIndex": 0, "topic": "specific topic name", "explanation": "why this is the correct answer", "reference": "verbatim citation"}]. Snippets:\n${context}`;

    let raw = '';
    
    // We send a direct prompt utilizing our grounded proxy
    if (provider.type === 'gemini') {
      const key = provider.key || '';
      if (!key) {
        throw new Error('Google Gemini key unconfigured. Please set your key in Synap Settings.');
      }
      const ai = new GoogleGenAI({ apiKey: key });
      const resp = await ai.models.generateContent({
        model: provider.model || 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: "You are Synap's item generation engine. You output ONLY valid raw JSON arrays. You NEVER append comments or markdown wraps.",
          temperature: 0.5,
        },
      });
      raw = resp.text || '';
    } else {
      // Fallback
      raw = await this.queryGroundedAI(notebookId, prompt, "You output strictly valid JSON array strings. No conversational fluff.");
    }

    try {
      const cleaned = raw.replace(/```json|```/g, '').trim();
      const start = cleaned.indexOf('[') === -1 ? cleaned.indexOf('{') : cleaned.indexOf('[');
      if (start === -1) throw new Error('No JSON envelope detected');
      const jsonStr = cleaned.slice(start);
      const parsed = JSON.parse(jsonStr);
      
      return parsed.map((item: any) => ({
        id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type,
        prompt: item.prompt,
        answer: item.answer,
        options: item.options,
        correctIndex: item.correctIndex,
        explanation: item.explanation,
        reference: item.reference,
        topic: item.topic || 'Core Concept',
        vulnerability: item.vulnerability || 'moderate',
        history: [],
      }));
    } catch (err: any) {
      console.warn('Synap study item generation error, parsing raw output:', raw, err);
      throw new Error(`Failed to parse generated study items. Please try generating again.`);
    }
  },

  /**
   * Export an active synthexis audit report directly into a study notebook
   */
  async exportResearchSession(prompt: string, output: string): Promise<SynapNotebook> {
    const cleanTitle = prompt.length > 50 ? prompt.slice(0, 50) + '...' : prompt;
    const notebook = await this.createNotebook(cleanTitle, 'RES-EXP');

    // Create a new source document with compiled research findings
    const newSource: SynapSource = {
      id: `src-${Date.now()}`,
      title: 'Compiled Synthexis Report',
      text: '', // Stored chunked
      type: 'notes',
      addedAt: new Date().toLocaleDateString(),
      wordCount: `${output.split(/\s+/).length} words`,
      badge: 'Research Export',
    };

    // Store compiled report as chunks
    const chunks = chunkText(notebook.id, newSource.id, newSource.title, output);
    const db = await getDB();
    if (chunks.length > 0) {
      const tx = db.transaction('chunks', 'readwrite');
      const store = tx.objectStore('chunks');
      for (const ch of chunks) {
        await store.put(ch);
      }
      await tx.done;
    }

    // Instantly seed 2 beautiful customized flashcards
    const seedFlashcards: SynapStudyItem[] = [
      {
        id: `item-${Date.now()}-1`,
        type: 'flashcard',
        prompt: `What was the primary research inquiry for: "${cleanTitle}"?`,
        answer: `The research objective focused on investigating: ${prompt}`,
        topic: 'Objective',
        vulnerability: 'moderate',
        history: [],
      },
      {
        id: `item-${Date.now()}-2`,
        type: 'flashcard',
        prompt: `What is a core conclusion from the synthexis report?`,
        answer: output.length > 250 ? output.slice(0, 250) + '...' : output,
        topic: 'Synthexis Summary',
        vulnerability: 'critical',
        history: [],
      }
    ];

    notebook.sources = [newSource];
    notebook.sourceCount = 1;
    notebook.studyItems = seedFlashcards;
    notebook.weakCount = 1;

    await this.saveNotebook(notebook);
    return notebook;
  }
};
