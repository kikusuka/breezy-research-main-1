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

export const initialNotebooks: SynapNotebook[] = [
  {
    id: 'bio-301',
    title: '[Sample] Cognitive Neuroscience & Synaptic Plasticity',
    courseCode: 'Bio 301',
    track: 'Sample Course',
    examDate: 'May 18',
    daysLeft: 4,
    readiness: 81,
    masteredCount: 142,
    weakCount: 9,
    sourceCount: 4,
    createdAt: new Date().toISOString(),
    topicTree: [
      { id: 't-1', name: 'Resting Membrane Potential', progress: 100 },
      {
        id: 't-2',
        name: 'NMDA Receptors',
        progress: 55,
        isWeakSpot: true,
        drillPrompt:
          'Explain why NMDA receptors act as molecular coincidence detectors and why magnesium unblocks at -30mV.',
      },
      { id: 't-3', name: 'Calcium (Ca²⁺) Influx Dynamics', progress: 88 },
      {
        id: 't-4',
        name: 'CaMKII Cascade & LTP',
        progress: 40,
        isWeakSpot: true,
        drillPrompt:
          'Can you walk me through the CaMKII autophosphorylation cascade leading to spine enlargement?',
      },
    ],
    sources: [
      {
        id: 's-1',
        title: 'Kandel_Principles_Ch12_Synaptic_Transmission.pdf',
        type: 'pdf',
        notesCount: 42,
        badge: 'Deeply Indexed',
        text: `Kandel Principles of Neural Science, Ch. 12 (pp. 248–289):
Chemical Gate: Glutamate binding opens channel pore.
Voltage Gate: At resting potential (-70 mV), extracellular Magnesium (Mg²⁺) ions clog the outer channel mouth.
Electrostatic Expulsion: Adjacent AMPA receptors depolarize the dendrite to roughly -30 mV, expelling the Mg²⁺ ion and allowing Ca²⁺ influx.
NMDA channels conduct Ca²⁺ and Na⁺. Ca²⁺ activates CaMKII and calcineurin.
Thr286 autophosphorylation locks CaMKII in a constitutively active state.`,
        addedAt: '2 days ago',
      },
      {
        id: 's-2',
        title: 'Lecture_08_Long_Term_Potentiation_Slides.pdf',
        type: 'slides',
        notesCount: 38,
        weakSpotsTied: 3,
        text: `Lecture 08 LTP & Plasticity:
Slide 19: The Molecular Memory Switch. Persistent Ca²⁺ influx binds calmodulin, triggering CaMKII autophosphorylation at Thr286.
Retrograde messenger: Nitric Oxide (NO) and endocannabinoids (2-AG) act on presynaptic CB1 receptors to modulate glutamate release probability.`,
        addedAt: 'Yesterday',
      },
      {
        id: 's-3',
        title: 'Lab_Report_Patch_Clamp_Electrophysiology.md',
        type: 'notes',
        wordCount: '14k words',
        text: `Patch clamp electrophysiology in hippocampal CA1 pyramidal neurons. APV blocks NMDA receptors selectively. CNQX blocks AMPA receptors. High-frequency tetanus (100 Hz, 1 sec) induces robust LTP only when NMDA receptors are unblocked.`,
        addedAt: '3 days ago',
      },
      {
        id: 's-4',
        title: '[Sample] Field_Notes_Hippocampal_Circuitry.txt',
        type: 'text',
        wordCount: 'Raw text',
        text: `Hippocampus tri-synaptic loop: Perforant path -> Dentate Gyrus (granule cells) -> Mossy fibers -> CA3 (pyramidal cells) -> Schaffer collaterals -> CA1 pyramidal cells -> Subiculum -> Entorhinal Cortex.`,
        addedAt: '4 days ago',
      },
    ],
    chat: [
      {
        id: 'msg-1',
        role: 'user',
        content:
          'Can you clarify why NMDA receptor activation requires both glutamate binding AND postsynaptic depolarization? I keep missing this question in quizzes.',
        timestamp: '11:42 PM',
      },
      {
        id: 'msg-2',
        role: 'assistant',
        content:
          "Great question — this exact concept showed up in 3 quiz misses this week, so let's lock it down together.\n\nHere is the molecular key directly from Kandel Ch. 12 (p. 254):",
        timestamp: '11:43 PM',
        citations: ['Kandel Ch. 12, Fig 12-4: Mg²⁺ Unblock Mechanism (p. 254)'],
        steps: [
          {
            stepNum: 1,
            title: 'Chemical Gate',
            desc: 'Glutamate binding is necessary to induce the conformational change that opens the physical channel pore.',
          },
          {
            stepNum: 2,
            title: 'Voltage Gate',
            desc: 'At resting membrane potential (-70 mV), extracellular Magnesium (Mg²⁺) ions are physically sucked into the outer channel mouth by the negative interior electrical charge, clogging the pore.',
          },
          {
            stepNum: 3,
            title: 'The Breakthrough',
            desc: 'Only when adjacent AMPA receptors first depolarize the dendrite to roughly -30 mV is that positive Mg²⁺ ion electrostatically expelled (repelled by the loss of negative pull), allowing calcium (Ca²⁺) to freely flood inside.',
            highlight: 'tertiary',
          },
        ],
      },
      {
        id: 'msg-3',
        role: 'user',
        content:
          'Ah! The Mg²⁺ plug acts like a cork that only pops when the voltage reverses!',
        timestamp: '11:44 PM',
      },
      {
        id: 'msg-4',
        role: 'assistant',
        content:
          '💡 **Exactly right!**\n\nYou just converted a persistent weak spot into an enduring mental model. This concept has been logged into your mastery review history.',
        timestamp: 'Just now',
        masteryUpdate: {
          topic: 'NMDA Receptors',
          from: 55,
          to: 78,
        },
      },
    ],
    studyItems: [
      {
        id: 'fc-1',
        type: 'flashcard',
        topic: 'NMDA Receptors',
        prompt:
          'Why does the NMDA receptor require postsynaptic depolarization in addition to glutamate binding to conduct Ca²⁺ ions?',
        answer:
          '1. Molecular Blockade: At resting membrane potential (-70 mV), extracellular Mg²⁺ ions are drawn electrostatically into the pore, physically obstructing ionic conductance.\n2. Electrostatic Expulsion: Depolarization to ~ -30 mV expels the divalent Mg²⁺ cation, allowing Ca²⁺ and Na⁺ to influx.',
        vulnerability: 'critical',
        riskImpact: 'Needs Review',
        reference: 'Kandel Principles of Neural Science, Ch. 12, p. 254',
        history: [
          { timestamp: '2026-05-13T10:00:00Z', correct: false },
          { timestamp: '2026-05-13T15:00:00Z', correct: false },
          { timestamp: '2026-05-14T09:00:00Z', correct: true, rating: 3 },
        ],
      },
      {
        id: 'fc-2',
        type: 'flashcard',
        topic: 'Retrograde Endocannabinoid Signaling',
        prompt:
          'What is the mechanism of retrograde endocannabinoid signaling in synaptic suppression?',
        answer:
          'Postsynaptic Ca²⁺ influx stimulates 2-AG synthesis on demand. 2-AG diffuses backwards across the synaptic cleft to bind presynaptic CB1 receptors (Gi-coupled), inhibiting presynaptic voltage-gated Ca²⁺ channels and reducing glutamate release.',
        vulnerability: 'critical',
        riskImpact: 'Needs Review',
        reference: 'Squire Neuro Ch. 7 & Recitation 4',
        history: [
          { timestamp: '2026-05-12T10:00:00Z', correct: false },
          { timestamp: '2026-05-13T12:00:00Z', correct: false },
          { timestamp: '2026-05-14T08:00:00Z', correct: false },
        ],
      },
      {
        id: 'fc-3',
        type: 'flashcard',
        topic: 'CaMKII Autophosphorylation (Thr286)',
        prompt:
          'Why is CaMKII autophosphorylation at Thr286 called a molecular memory switch?',
        answer:
          'Once Ca²⁺/Calmodulin activates CaMKII, adjacent subunits phosphorylate Thr286. This locks the enzyme in an autonomous active state even after Ca²⁺ drops, enabling persistent AMPA receptor phosphorylation and insertion.',
        vulnerability: 'critical',
        riskImpact: 'High Priority',
        reference: 'Molecular Memory Module 3',
        history: [
          { timestamp: '2026-05-12T10:00:00Z', correct: false },
          { timestamp: '2026-05-13T12:00:00Z', correct: false },
        ],
      },
      {
        id: 'qz-1',
        type: 'quiz',
        topic: 'Receptor Electrophysiology',
        prompt:
          'A researcher applies APV (an NMDA receptor antagonist) to a hippocampal slice preparation before delivering a high-frequency tetanus stimulation (100 Hz). What is the expected physiological outcome on synaptic strength?',
        options: [
          'Baseline EPSP amplitudes will permanently double.',
          'Early and late-phase LTP induction will be blocked; synaptic transmission remains at baseline.',
          'Long-Term Depression (LTD) will immediately be triggered instead.',
          'Presynaptic glutamate release will be irreversibly inhibited.',
        ],
        correctIndex: 1,
        explanation:
          'APV selectively and competitively binds NMDA receptors, preventing Ca²⁺ influx even during robust 100 Hz tetanic depolarization. Because Ca²⁺ entry through NMDA is the essential trigger for CaMKII autophosphorylation, LTP induction is fully blocked. Baseline transmission via AMPA receptors remains unaffected.',
        reference: 'Referenced in Lecture 8 (Slide 19) & Kandel Ch. 12',
        history: [{ timestamp: '2026-05-14T11:00:00Z', correct: true }],
      },
    ],
  },
  {
    id: 'cs-442',
    title: '[Sample] Distributed Systems & Consensus',
    courseCode: 'CS 442',
    track: 'Sample Course',
    examDate: 'May 24',
    daysLeft: 10,
    readiness: 64,
    masteredCount: 98,
    weakCount: 16,
    sourceCount: 7,
    createdAt: new Date().toISOString(),
    topicTree: [
      { id: 'cs-t1', name: 'Raft Leader Election', progress: 80 },
      {
        id: 'cs-t2',
        name: 'Split-Brain Quorum Safety',
        progress: 45,
        isWeakSpot: true,
      },
      {
        id: 'cs-t3',
        name: 'Vector Clocks & Causality',
        progress: 52,
        isWeakSpot: true,
      },
    ],
    sources: [],
    chat: [],
    studyItems: [],
  },
  {
    id: 'math-220',
    title: '[Sample] Discrete Mathematics & Graph Theory',
    courseCode: 'Math 220',
    track: 'Sample Course',
    examDate: 'June 2',
    daysLeft: 19,
    readiness: 92,
    masteredCount: 210,
    weakCount: 3,
    sourceCount: 5,
    createdAt: new Date().toISOString(),
    topicTree: [
      { id: 'm-t1', name: 'Planar Graphs & Euler Formula', progress: 95 },
      { id: 'm-t2', name: 'Eulerian & Hamiltonian Tours', progress: 90 },
    ],
    sources: [],
    chat: [],
    studyItems: [],
  },
  {
    id: 'phil-215',
    title: 'History of Modern Philosophy: Epistemology',
    courseCode: 'Phil 215',
    track: 'Humanities Track',
    examDate: 'June 8',
    daysLeft: 25,
    readiness: 73,
    masteredCount: 84,
    weakCount: 8,
    sourceCount: 3,
    createdAt: new Date().toISOString(),
    topicTree: [
      { id: 'p-t1', name: 'Spinoza Monism', progress: 85 },
      {
        id: 'p-t2',
        name: 'Kant Transcendental Deduction',
        progress: 48,
        isWeakSpot: true,
      },
    ],
    sources: [],
    chat: [],
    studyItems: [],
  },
];

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
    } catch {
      // Fallback generator
      return [
        {
          id: `item-${Date.now()}`,
          type,
          prompt:
            type === 'flashcard'
              ? 'What is the role of CaMKII in long-term potentiation?'
              : 'Which receptor acts as the primary molecular coincidence detector in CA1 hippocampal synapses?',
          answer:
            'CaMKII autophosphorylates at Thr286 upon Ca²⁺/Calmodulin binding, remaining persistently active to phosphorylate AMPA receptors.',
          options: [
            'AMPA Receptor',
            'NMDA Receptor',
            'Kainate Receptor',
            'GABA-A Receptor',
          ],
          correctIndex: 1,
          explanation:
            'NMDA receptors require simultaneous glutamate binding and postsynaptic depolarization to relieve the Mg²⁺ blockade.',
          reference: 'Lecture 8 LTP & Kandel Ch. 12',
          topic: 'Synaptic Plasticity',
          vulnerability: 'moderate',
          riskImpact: '-3.0% Risk',
          history: [],
        },
      ];
    }
  },
};
