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
        return JSON.parse(raw);
      }
    } catch {}
    this.saveNotebooks(initialNotebooks);
    return initialNotebooks;
  },

  saveNotebooks(notebooks: SynapNotebook[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_NOTEBOOKS, JSON.stringify(notebooks));
    } catch (e) {
      console.warn('Failed to save Synap notebooks:', e);
    }
  },

  getActiveNotebookId(): string {
    return localStorage.getItem(STORAGE_KEY_ACTIVE_NB) || 'bio-301';
  },

  setActiveNotebookId(id: string): void {
    localStorage.setItem(STORAGE_KEY_ACTIVE_NB, id);
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
