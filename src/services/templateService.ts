import { LayoutType, THEME_PRESETS } from '../types/mindmap';
import { sanitizeMapData } from '../lib/sanitize';

export type TemplateCategory =
  | 'Strategic Planning'
  | 'Project Management'
  | 'Engineering & Systems'
  | 'Organization & Team'
  | 'My Templates';

export interface MindMapTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  layout: LayoutType;
  themeId: string;
  isCustom?: boolean;
  createdAt?: string;
  /** Full document { layout, root, theme } or node tree { data, children } */
  data: any;
}

const CUSTOM_TEMPLATES_KEY = 'zenmind_custom_templates_v1';

function buildFullDoc(layout: LayoutType, themeId: string, root: any) {
  const preset = THEME_PRESETS.find((t) => t.id === themeId) || THEME_PRESETS[0];
  return {
    layout,
    root,
    theme: {
      template: 'default',
      config: { ...preset.config },
    },
  };
}

export const BUILTIN_TEMPLATES: MindMapTemplate[] = [
  {
    id: 'swot-analysis',
    name: 'SWOT Analysis',
    category: 'Strategic Planning',
    description: 'Evaluate Strengths, Weaknesses, Opportunities, and Threats for a product or initiative.',
    layout: 'mindMap',
    themeId: 'ocean-breeze',
    data: buildFullDoc('mindMap', 'ocean-breeze', {
      data: { text: 'SWOT Analysis', expand: true },
      children: [
        {
          data: { text: 'Strengths (Internal)', expand: true, tag: ['Positive'] },
          children: [
            { data: { text: 'Core technical advantage' } },
            { data: { text: 'Experienced domain team' } },
            { data: { text: 'Low operational overhead' } },
          ],
        },
        {
          data: { text: 'Weaknesses (Internal)', expand: true, tag: ['Gap'] },
          children: [
            { data: { text: 'Limited brand awareness' } },
            { data: { text: 'Resource constraints' } },
          ],
        },
        {
          data: { text: 'Opportunities (External)', expand: true, tag: ['Growth'] },
          children: [
            { data: { text: 'Underserved market segment' } },
            { data: { text: 'Strategic partner integrations' } },
          ],
        },
        {
          data: { text: 'Threats (External)', expand: true, tag: ['Risk'] },
          children: [
            { data: { text: 'Incumbent price competition' } },
            { data: { text: 'Regulatory & compliance shifts' } },
          ],
        },
      ],
    }),
  },
  {
    id: 'pestel-analysis',
    name: 'PESTEL Analysis',
    category: 'Strategic Planning',
    description: 'Analyze Political, Economic, Social, Technological, Environmental, and Legal macro factors.',
    layout: 'logicalStructure',
    themeId: 'violet-creativity',
    data: buildFullDoc('logicalStructure', 'violet-creativity', {
      data: { text: 'PESTEL Macro Analysis', expand: true },
      children: [
        {
          data: { text: 'Political', expand: true },
          children: [{ data: { text: 'Trade & tax policies' } }, { data: { text: 'Government incentives' } }],
        },
        {
          data: { text: 'Economic', expand: true },
          children: [{ data: { text: 'Interest & inflation rates' } }, { data: { text: 'Enterprise IT budgets' } }],
        },
        {
          data: { text: 'Social', expand: true },
          children: [{ data: { text: 'Remote & hybrid workflows' } }, { data: { text: 'Privacy expectations' } }],
        },
        {
          data: { text: 'Technological', expand: true },
          children: [{ data: { text: 'Local AI & edge inference' } }, { data: { text: 'Cross-platform runtimes' } }],
        },
        {
          data: { text: 'Environmental', expand: true },
          children: [{ data: { text: 'Carbon footprint & energy efficiency' } }],
        },
        {
          data: { text: 'Legal', expand: true },
          children: [{ data: { text: 'Data sovereignty (GDPR / SOC2)' } }, { data: { text: 'Open-source licensing' } }],
        },
      ],
    }),
  },
  {
    id: 'porters-five-forces',
    name: "Porter's Five Forces",
    category: 'Strategic Planning',
    description: 'Map industry competition, supplier/buyer power, substitutes, and new entrants.',
    layout: 'mindMap',
    themeId: 'emerald-focus',
    data: buildFullDoc('mindMap', 'emerald-focus', {
      data: { text: "Porter's Five Forces", expand: true },
      children: [
        {
          data: { text: 'Competitive Rivalry', expand: true },
          children: [{ data: { text: 'Key competitors & differentiation' } }, { data: { text: 'Switching costs' } }],
        },
        {
          data: { text: 'Threat of New Entrants', expand: true },
          children: [{ data: { text: 'Capital & technical barriers' } }, { data: { text: 'Network effects' } }],
        },
        {
          data: { text: 'Threat of Substitutes', expand: true },
          children: [{ data: { text: 'Alternative workflows' } }, { data: { text: 'Price-to-performance ratio' } }],
        },
        {
          data: { text: 'Bargaining Power of Buyers', expand: true },
          children: [{ data: { text: 'Customer concentration' } }, { data: { text: 'Price sensitivity' } }],
        },
        {
          data: { text: 'Bargaining Power of Suppliers', expand: true },
          children: [{ data: { text: 'Cloud & API vendor lock-in' } }, { data: { text: 'Open-source alternatives' } }],
        },
      ],
    }),
  },
  {
    id: 'eisenhower-matrix',
    name: 'Eisenhower Priority Matrix',
    category: 'Project Management',
    description: 'Prioritize tasks across Urgent/Important quadrants with priority badges and checkboxes.',
    layout: 'mindMap',
    themeId: 'solar-warmth',
    data: buildFullDoc('mindMap', 'solar-warmth', {
      data: { text: 'Eisenhower Priority Matrix', expand: true },
      children: [
        {
          data: { text: 'Do First (Urgent & Important)', expand: true, icon: ['priority_1'] },
          children: [
            { data: { text: 'Resolve production blocker', icon: ['priority_1', 'progress_50'] } },
            { data: { text: 'Finalize release deliverable', icon: ['priority_1', 'progress_25'] } },
          ],
        },
        {
          data: { text: 'Schedule (Important, Not Urgent)', expand: true, icon: ['priority_2'] },
          children: [
            { data: { text: 'Q3 architecture roadmap', icon: ['priority_2', 'progress_0'] } },
            { data: { text: 'Automated test coverage', icon: ['priority_2', 'progress_0'] } },
          ],
        },
        {
          data: { text: 'Delegate (Urgent, Not Important)', expand: true, icon: ['priority_3'] },
          children: [
            { data: { text: 'Routine status reporting', icon: ['priority_3', 'progress_0'] } },
            { data: { text: 'Meeting scheduling', icon: ['priority_3', 'progress_100'] } },
          ],
        },
        {
          data: { text: 'Eliminate (Neither)', expand: true, icon: ['priority_4'] },
          children: [{ data: { text: 'Unfocused ad-hoc requests', icon: ['priority_4'] } }],
        },
      ],
    }),
  },
  {
    id: 'sprint-roadmap',
    name: 'Agile Sprint Roadmap',
    category: 'Project Management',
    description: 'Plan chronological sprint milestones, deliverables, and QA gates on a horizontal timeline.',
    layout: 'timeline',
    themeId: 'ocean-breeze',
    data: buildFullDoc('timeline', 'ocean-breeze', {
      data: { text: 'Product Release Roadmap', expand: true },
      children: [
        {
          data: { text: 'Sprint 1: Foundation', expand: true, icon: ['progress_100'] },
          children: [
            { data: { text: 'Core data model & schema', icon: ['progress_100'] } },
            { data: { text: 'CI/CD build pipeline', icon: ['progress_100'] } },
          ],
        },
        {
          data: { text: 'Sprint 2: Core Features', expand: true, icon: ['progress_50'] },
          children: [
            { data: { text: 'User workspace & templates', icon: ['progress_75'] } },
            { data: { text: 'Search & keyboard navigation', icon: ['progress_50'] } },
          ],
        },
        {
          data: { text: 'Sprint 3: Polish & QA', expand: true, icon: ['progress_0'] },
          children: [
            { data: { text: 'End-to-end regression suite', icon: ['progress_0'] } },
            { data: { text: 'Performance & accessibility audit', icon: ['progress_0'] } },
          ],
        },
        {
          data: { text: 'Sprint 4: Launch', expand: true, icon: ['progress_0'] },
          children: [
            { data: { text: 'Release notes & documentation', icon: ['progress_0'] } },
            { data: { text: 'Production deployment', icon: ['progress_0'] } },
          ],
        },
      ],
    }),
  },
  {
    id: 'risk-assessment',
    name: 'Project Risk Assessment',
    category: 'Project Management',
    description: 'Identify technical, schedule, and operational risks alongside concrete mitigation plans.',
    layout: 'logicalStructure',
    themeId: 'graphite-minimal',
    data: buildFullDoc('logicalStructure', 'graphite-minimal', {
      data: { text: 'Risk Register & Mitigations', expand: true },
      children: [
        {
          data: { text: 'Technical Risks', expand: true, icon: ['priority_1'] },
          children: [
            {
              data: { text: 'Third-party API rate limits', expand: true },
              children: [{ data: { text: 'Mitigation: Local fallback & exponential backoff' } }],
            },
            {
              data: { text: 'Data migration edge cases', expand: true },
              children: [{ data: { text: 'Mitigation: Dry-run validation & automated backups' } }],
            },
          ],
        },
        {
          data: { text: 'Schedule Risks', expand: true, icon: ['priority_2'] },
          children: [
            {
              data: { text: 'Scope creep during beta', expand: true },
              children: [{ data: { text: 'Mitigation: Strict v0.2 feature freeze gate' } }],
            },
          ],
        },
        {
          data: { text: 'Operational Risks', expand: true, icon: ['priority_3'] },
          children: [
            {
              data: { text: 'Single point of knowledge', expand: true },
              children: [{ data: { text: 'Mitigation: Architecture runbooks & pair reviews' } }],
            },
          ],
        },
      ],
    }),
  },
  {
    id: 'five-whys',
    name: 'Root Cause (5 Whys)',
    category: 'Engineering & Systems',
    description: 'Drill down from an incident symptom through 5 iterative Why layers to actionable remediation.',
    layout: 'logicalStructure',
    themeId: 'solar-warmth',
    data: buildFullDoc('logicalStructure', 'solar-warmth', {
      data: { text: 'Incident: Service Outage', expand: true },
      children: [
        {
          data: { text: '1. Why did the API stop responding?', expand: true },
          children: [
            {
              data: { text: '2. Why was the connection pool exhausted?', expand: true },
              children: [
                {
                  data: { text: '3. Why were database queries timing out?', expand: true },
                  children: [
                    {
                      data: { text: '4. Why was a full table scan triggered?', expand: true },
                      children: [
                        {
                          data: { text: '5. Root Cause: Missing composite index in migration', expand: true, icon: ['priority_1'] },
                          children: [
                            { data: { text: 'Action: Add index & query plan CI check', icon: ['progress_0'] } },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    }),
  },
  {
    id: 'fishbone-ishikawa',
    name: 'Fishbone (Ishikawa) Cause & Effect',
    category: 'Engineering & Systems',
    description: 'Structured Ishikawa fishbone diagram categorizing contributing factors across system domains.',
    layout: 'fishbone',
    themeId: 'ocean-breeze',
    data: buildFullDoc('fishbone', 'ocean-breeze', {
      data: { text: 'High Release Defect Rate', expand: true },
      children: [
        {
          data: { text: 'Code & Architecture', expand: true },
          children: [{ data: { text: 'Shared mutable state' } }, { data: { text: 'Incomplete type boundaries' } }],
        },
        {
          data: { text: 'Testing & QA', expand: true },
          children: [{ data: { text: 'Missing round-trip tests' } }, { data: { text: 'Manual smoke testing only' } }],
        },
        {
          data: { text: 'Process & Workflow', expand: true },
          children: [{ data: { text: 'Large unreviewed PRs' } }, { data: { text: 'Ambiguous acceptance criteria' } }],
        },
        {
          data: { text: 'Environment & Tooling', expand: true },
          children: [{ data: { text: 'Dev/prod config drift' } }, { data: { text: 'Slow CI feedback loop' } }],
        },
      ],
    }),
  },
  {
    id: 'system-architecture',
    name: 'System Architecture Blueprint',
    category: 'Engineering & Systems',
    description: 'Top-down system decomposition across client, services, data storage, and infrastructure.',
    layout: 'organizationStructure',
    themeId: 'graphite-minimal',
    data: buildFullDoc('organizationStructure', 'graphite-minimal', {
      data: { text: 'Platform Architecture', expand: true },
      children: [
        {
          data: { text: 'Client Tier', expand: true },
          children: [
            { data: { text: 'Tauri Native Desktop' } },
            { data: { text: 'Web PWA & Mobile UI' } },
          ],
        },
        {
          data: { text: 'Core Engine & Services', expand: true },
          children: [
            { data: { text: 'SVG Layout & Render Engine' } },
            { data: { text: 'Multi-Format Parser (OPML/XMind/MD)' } },
            { data: { text: 'AI Copilot Service (Gemini/Ollama)' } },
          ],
        },
        {
          data: { text: 'Persistence & Security', expand: true },
          children: [
            { data: { text: 'Local Filesystem (.zenmind)' } },
            { data: { text: 'Session & Snapshot Storage' } },
            { data: { text: 'HTML & Link Sanitizer' } },
          ],
        },
      ],
    }),
  },
  {
    id: 'org-chart',
    name: 'Organization & Team Chart',
    category: 'Organization & Team',
    description: 'Top-down organizational structure mapping leadership, departments, and team leads.',
    layout: 'organizationStructure',
    themeId: 'emerald-focus',
    data: buildFullDoc('organizationStructure', 'emerald-focus', {
      data: { text: 'Executive Leadership (CEO)', expand: true },
      children: [
        {
          data: { text: 'VP of Engineering', expand: true, tag: ['Tech'] },
          children: [
            { data: { text: 'Platform & Core Engine Lead' } },
            { data: { text: 'Frontend & Design Systems Lead' } },
            { data: { text: 'QA & Release Automation Lead' } },
          ],
        },
        {
          data: { text: 'VP of Product & Design', expand: true, tag: ['Product'] },
          children: [
            { data: { text: 'Product Management' } },
            { data: { text: 'UX Research & Interaction Design' } },
          ],
        },
        {
          data: { text: 'VP of Operations & Growth', expand: true, tag: ['Ops'] },
          children: [
            { data: { text: 'Community & Developer Relations' } },
            { data: { text: 'Customer Success & Support' } },
          ],
        },
      ],
    }),
  },
];

export class TemplateService {
  static getAllTemplates(): MindMapTemplate[] {
    return [...BUILTIN_TEMPLATES, ...this.getCustomTemplates()];
  }

  static getCustomTemplates(): MindMapTemplate[] {
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(CUSTOM_TEMPLATES_KEY) : null;
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(
        (t: any) => t && typeof t.id === 'string' && typeof t.name === 'string' && t.data
      );
    } catch {
      return [];
    }
  }

  static saveCustomTemplate(params: {
    name: string;
    description?: string;
    layout: LayoutType;
    themeId: string;
    data: any;
  }): MindMapTemplate {
    const existing = this.getCustomTemplates();
    const clonedData = sanitizeMapData(JSON.parse(JSON.stringify(params.data)));
    const template: MindMapTemplate = {
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: params.name.trim() || 'Custom Template',
      category: 'My Templates',
      description: params.description?.trim() || 'Personal saved mind map template',
      layout: params.layout,
      themeId: params.themeId,
      isCustom: true,
      createdAt: new Date().toISOString(),
      data: clonedData,
    };
    const next = [template, ...existing];
    try {
      localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(next));
    } catch {
      // ignore storage quota errors
    }
    return template;
  }

  static deleteCustomTemplate(id: string): MindMapTemplate[] {
    const next = this.getCustomTemplates().filter((t) => t.id !== id);
    try {
      localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
    return next;
  }

  /** Deep-clones a template's data so opening it never mutates the template definition. */
  static instantiateTemplate(template: MindMapTemplate): any {
    return sanitizeMapData(JSON.parse(JSON.stringify(template.data)));
  }
}
