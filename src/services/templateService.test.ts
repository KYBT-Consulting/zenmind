import { beforeEach, describe, expect, it } from 'vitest';
import { BUILTIN_TEMPLATES, TemplateService } from './templateService';

describe('TemplateService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('includes 10 built-in starter templates across all 4 core categories', () => {
    expect(BUILTIN_TEMPLATES.length).toBeGreaterThanOrEqual(10);
    const categories = new Set(BUILTIN_TEMPLATES.map((t) => t.category));
    expect(categories.has('Strategic Planning')).toBe(true);
    expect(categories.has('Project Management')).toBe(true);
    expect(categories.has('Engineering & Systems')).toBe(true);
    expect(categories.has('Organization & Team')).toBe(true);
  });

  it('saves, lists, and deletes custom personal templates in localStorage', () => {
    const saved = TemplateService.saveCustomTemplate({
      name: 'Quarterly OKR Review',
      description: 'Objectives and Key Results hierarchy',
      layout: 'logicalStructure',
      themeId: 'emerald-focus',
      data: {
        layout: 'logicalStructure',
        root: {
          data: { text: 'Q3 OKRs' },
          children: [{ data: { text: 'Objective 1' }, children: [] }],
        },
      },
    });

    expect(saved.isCustom).toBe(true);
    expect(saved.category).toBe('My Templates');

    const customs = TemplateService.getCustomTemplates();
    expect(customs).toHaveLength(1);
    expect(customs[0].name).toBe('Quarterly OKR Review');

    TemplateService.deleteCustomTemplate(saved.id);
    expect(TemplateService.getCustomTemplates()).toHaveLength(0);
  });

  it('returns a sanitized deep copy when instantiating a template', () => {
    const swot = BUILTIN_TEMPLATES[0];
    const instance1 = TemplateService.instantiateTemplate(swot);
    const instance2 = TemplateService.instantiateTemplate(swot);

    expect(instance1).not.toBe(instance2);
    instance1.root.data.text = 'Mutated Root';
    expect(instance2.root.data.text).toBe('SWOT Analysis');
  });
});
