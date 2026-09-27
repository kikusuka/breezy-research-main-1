import {
  SynapNotebook,
  SynapSource,
  SynapStudyItem,
  SynapProviderConfig,
  SynapChatMessage,
} from '../types/synap';
import { GoogleGenAI } from '@google/genai';

const STORAGE_KEY_NOTEBOOKS = 'synap:notebooks';
const STORAGE_KEY_PROVIDER = 'synap:provider';
const STORAGE_KEY_ACTIVE_NB = 'synap:active_notebook_id';

export const initialNotebooks: SynapNotebook[] = [];

export const synapService = {
  loadNotebooks(): SynapNotebook[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_NOTEBOOKS);
      if (raw) {
        const parsed: SynapNotebook[] = JSON.parse(raw);
        // Clean out all legacy hardcoded sample/prototype notebooks so users operate on real data
        const cleanNotebooks = Array.isArray(parsed)
          ? parsed.filter((nb: SynapNotebook) => {
              if (!nb || !nb.id) return false;
              const id = nb.id.toLowerCase();
              const title = (nb.title || '').toLowerCase();
              const code = (nb.courseCode || '').toLowerCase();
              const isSampleId =
                ['bio-301', 'cs-442', 'math-210', 'math-220', 'phil-102', 'phil-215', 'sample-nb-1', 'sample-nb-2'].includes(id) ||
                id.startsWith('sample-');
              const isSampleTitle =
                title.includes('discrete mathematics') ||
                title.includes('history of modern philosophy') ||
                title.includes('cellular neurobiology') ||
                title.includes('distributed systems & consensus');
              const isSampleCode =
                code.includes('math 220') || code.includes('phil 215') || code.includes('bio 301');
              const isSampleDate =
                (nb.examDate === 'June 2' || nb.examDate === 'June 8') &&
                (nb.daysLeft === 19 || nb.daysLeft === 25);
              return !isSampleId && !isSampleTitle && !isSampleCode && !isSampleDate;
            })
          : [];
        // Immediately persist the sanitized notebooks list back to localStorage
        this.saveNotebooks(cleanNotebooks);
        return cleanNotebooks;
      }
    } catch {}
    this.saveNotebooks([]);
    return [];
  },

  saveNotebooks(notebooks: SynapNotebook[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_NOTEBOOKS, JSON.stringify(notebooks));
    } catch (e) {
      console.warn('Failed to save Synap notebooks directly; attempting compression/pruning to protect storage quota:', e);
      try {
        const pruned = (notebooks || []).map((nb) => ({
          ...nb,
          chat: (nb.chat || []).slice(-30),
          sources: (nb.sources || []).map((src) => ({
            ...src,
            text: src.text && src.text.length > 35000 ? src.text.slice(0, 35000) + '... [Indexed Content Truncated for Quota]' : src.text,
          })),
        }));
        localStorage.setItem(STORAGE_KEY_NOTEBOOKS, JSON.stringify(pruned));
      } catch (err) {
        console.error('Critical quota error when saving notebooks:', err);
      }
    }
  },

  getActiveNotebookId(): string {
    return localStorage.getItem(STORAGE_KEY_ACTIVE_NB) || '';
  },

  setActiveNotebookId(id: string): void {
    localStorage.setItem(STORAGE_KEY_ACTIVE_NB, id);
  },

  getActiveNotebook(): SynapNotebook | null {
    const nbs = this.loadNotebooks();
    const activeId = this.getActiveNotebookId();
    if (activeId) {
      const found = nbs.find((n) => n.id === activeId);
      if (found) return found;
    }
    if (nbs.length > 0) return nbs[0];
    return null;
  },

  createNotebook(title: string, courseCode: string = 'GEN-101'): SynapNotebook {
    const newNb: SynapNotebook = {
      id: `nb-${Date.now()}`,
      title: title.trim() || 'New Notebook',
      courseCode: courseCode.trim().toUpperCase() || 'COURSE',
      track: 'General',
      examDate: '',
      daysLeft: 0,
      readiness: 0,
      masteredCount: 0,
      weakCount: 0,
      sourceCount: 0,
      createdAt: new Date().toISOString(),
      sources: [],
      studyItems: [],
      chat: [],
      topicTree: [],
    };
    const nbs = this.loadNotebooks();
    this.saveNotebooks([newNb, ...nbs]);
    this.setActiveNotebookId(newNb.id);
    return newNb;
  },

  addStudyItems(notebookId: string, items: SynapStudyItem[]): void {
    const nbs = this.loadNotebooks();
    const updated = nbs.map((nb) => {
      if (nb.id === notebookId) {
        return {
          ...nb,
          studyItems: [...(nb.studyItems || []), ...items],
        };
      }
      return nb;
    });
    this.saveNotebooks(updated);
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

  async queryGroundedAI(
    prompt: string,
    sources: SynapSource[],
    systemInstruction = ''
  ): Promise<string> {
    if (!sources || sources.length === 0) {
      return "This notebook has no indexed document sources yet. Upload notes, PDFs, or slides using 'Add Doc / PDF' to enable grounded AI answers.";
    }

    const provider = this.getProvider();
    const context = sources
      .map((s) => `--- SOURCE: ${s.title} ---\n${s.text}`)
      .join('\n\n');
    const fullPrompt = `Sources Available in this Notebook:\n${context}\n\nStudent Question:\n${prompt}\n\nInstructions:\nAnswer accurately and concisely, grounding your answer strictly in the provided sources. Cite specific pages, slide numbers, or sections.`;

    // 1. If Gemini
    if (provider.type === 'gemini') {
      const key =
        provider.key ||
        (import.meta as any).env.VITE_GEMINI_API_KEY ||
        '';
      const ai = new GoogleGenAI({ apiKey: key || undefined });
      const resp = await ai.models.generateContent({
        model: provider.model || 'gemini-3.8-flash',
        contents: fullPrompt,
        config: {
          systemInstruction:
            systemInstruction ||
            "You are Synap, an encouraging and rigorous cognitive study companion. You cite sources clearly and help students build permanent mental models.",
          temperature: 0.3,
        },
      });
      return (
        resp.text ||
        'Grounded synthesis completed based on your course sources.'
      );
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
          system: systemInstruction,
          messages: [{ role: 'user', content: fullPrompt }],
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      return data.content.map((b: any) => b.text || '').join('\n');
    }

    // 3. Default OpenAI-compatible (Groq / Together / OpenAI)
    const base = (
      provider.baseUrl || 'https://api.openai.com/v1'
    ).replace(/\/$/, '');
    const res = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${provider.key}`,
      },
      body: JSON.stringify({
        model: provider.model || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              systemInstruction ||
              'You are Synap, a grounded cognitive study coach.',
          },
          { role: 'user', content: fullPrompt },
        ],
        temperature: 0.3,
      }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data.choices?.[0]?.message?.content || '';
  },

  async generateItems(
    nb: SynapNotebook,
    type: 'flashcard' | 'quiz'
  ): Promise<SynapStudyItem[]> {
    const context = nb.sources
      .map((s) => `--- ${s.title} ---\n${s.text}`)
      .join('\n\n');
    const prompt =
      type === 'flashcard'
        ? `Create 5 flashcards from these sources as a JSON array: [{"prompt": "...", "answer": "...", "topic": "...", "vulnerability": "moderate", "riskImpact": "-3.0% Risk", "reference": "Source Ch X"}]. Return ONLY raw JSON array.`
        : `Create 4 multiple choice quiz questions as a JSON array: [{"prompt": "...", "options": ["A","B","C","D"], "correctIndex": 0, "topic": "...", "explanation": "...", "reference": "Source Ch X"}]. Return ONLY raw JSON array.`;

    const raw = await this.queryGroundedAI(prompt, nb.sources);
    try {
      const cleaned = raw.replace(/```json|```/g, '').trim();
      const start =
        cleaned.indexOf('[') === -1
          ? cleaned.indexOf('{')
          : Math.min(
              ...[cleaned.indexOf('['), cleaned.indexOf('{')].filter(
                (i) => i !== -1
              )
            );
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
        riskImpact: item.riskImpact || '-2.5% Risk',
        history: [],
      }));
    } catch (err: any) {
      console.warn('Synap study item generation error:', err);
      throw new Error(
        `Failed to parse generated study items from source notes. Your source materials are untouched. Please try generating again.`
      );
    }
  },
};
