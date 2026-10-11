import { GoogleGenAI } from '@google/genai';

export interface GeneratedMindMapNode {
  data: {
    text: string;
    expand?: boolean;
    shape?: string;
    fillColor?: string;
  };
  children?: GeneratedMindMapNode[];
}

export class AIService {
  private static getApiKey(): string | null {
    return (
      localStorage.getItem('zenmind_gemini_api_key') ||
      (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
      null
    );
  }

  static async generateMindMapFromPrompt(topic: string): Promise<GeneratedMindMapNode> {
    const apiKey = this.getApiKey();

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const systemPrompt = `You are a professional mind mapping architect. Given a topic, create a structured hierarchical mind map in pure JSON format.
Output ONLY valid JSON with this exact schema without markdown backticks or explanations:
{
  "data": { "text": "Topic Title" },
  "children": [
    {
      "data": { "text": "Main Branch 1" },
      "children": [
        { "data": { "text": "Subtopic 1.1" } },
        { "data": { "text": "Subtopic 1.2" } }
      ]
    }
  ]
}
Create 3-5 main branches and 2-4 subtopics per branch. Keep text concise (2-5 words per node).`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `${systemPrompt}\n\nTopic: ${topic}`,
        });

        const text = response.text || '';
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (parsed.data && parsed.data.text) {
          return parsed;
        }
      } catch (err) {
        console.warn('Gemini API call failed or returned invalid JSON, using intelligent fallback:', err);
      }
    }

    // Intelligent fallback template if no API key or offline
    return {
      data: { text: topic },
      children: [
        {
          data: { text: 'Key Concepts & Foundation' },
          children: [
            { data: { text: 'Definitions & Scope' } },
            { data: { text: 'Core Principles' } },
            { data: { text: 'Prerequisites' } },
          ],
        },
        {
          data: { text: 'Strategy & Execution' },
          children: [
            { data: { text: 'Planning & Milestones' } },
            { data: { text: 'Resource Allocation' } },
            { data: { text: 'Action Items' } },
          ],
        },
        {
          data: { text: 'Best Practices' },
          children: [
            { data: { text: 'Standards & Workflows' } },
            { data: { text: 'Common Pitfalls' } },
            { data: { text: 'Quality Assurance' } },
          ],
        },
        {
          data: { text: 'Future Growth & Metrics' },
          children: [
            { data: { text: 'KPIs & Monitoring' } },
            { data: { text: 'Next Steps & Scaling' } },
          ],
        },
      ],
    };
  }

  static async expandTopic(parentTopic: string): Promise<string[]> {
    const apiKey = this.getApiKey();

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `Provide 4-5 relevant, concise subtopic ideas for a mind map branch labeled: "${parentTopic}".
Output ONLY a JSON array of strings, e.g. ["Subtopic 1", "Subtopic 2", "Subtopic 3", "Subtopic 4"]. No extra commentary.`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        const text = response.text || '';
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (err) {
        console.warn('Gemini API topic expansion failed, falling back:', err);
      }
    }

    return [
      `Key Insights on ${parentTopic}`,
      `Practical Steps`,
      `Dependencies & Risks`,
      `Expected Deliverables`,
    ];
  }
}
