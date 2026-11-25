import { describe, expect, it } from 'vitest';
import {
  axesToQuadrant,
  computeCoveyDataPatch,
  formatCoveyCanvasBadge,
  groupItemsByCoveyQuadrant,
  resolveCoveyAttributes,
  resolveCoveyQuadrant,
} from './coveyMatrix';
import { extractAllTasks } from './taskDates';

describe('Covey Four Quadrant attribute resolution', () => {
  it('maps Urgent and Important boolean combinations to Quadrants 1..4', () => {
    expect(axesToQuadrant(true, true)).toBe(1);
    expect(axesToQuadrant(false, true)).toBe(2);
    expect(axesToQuadrant(true, false)).toBe(3);
    expect(axesToQuadrant(false, false)).toBe(4);
  });

  it('keeps unclassified nodes unassigned (null) rather than defaulting to Q4', () => {
    expect(resolveCoveyQuadrant({})).toBeNull();
    expect(resolveCoveyQuadrant(null)).toBeNull();
    expect(resolveCoveyAttributes({ urgent: undefined, important: undefined })).toEqual({
      quadrant: null,
    });
  });

  it('resolves attributes from either boolean axes or quadrant id', () => {
    expect(resolveCoveyAttributes({ urgent: true, important: true })).toEqual({
      urgent: true,
      important: true,
      quadrant: 1,
    });
    expect(resolveCoveyAttributes({ quadrant: 2 })).toEqual({
      urgent: false,
      important: true,
      quadrant: 2,
    });
    expect(resolveCoveyAttributes({ urgent: true })).toEqual({
      urgent: true,
      important: false,
      quadrant: 3,
    });
    expect(resolveCoveyAttributes({ important: true })).toEqual({
      urgent: false,
      important: true,
      quadrant: 2,
    });
    expect(resolveCoveyAttributes({ urgent: false, important: false })).toEqual({
      urgent: false,
      important: false,
      quadrant: 4,
    });
  });

  it('computes synchronized patches when updating quadrant or individual axes', () => {
    // Direct quadrant selection
    expect(computeCoveyDataPatch({}, { quadrant: 2 })).toEqual({
      urgent: false,
      important: true,
      quadrant: 2,
    });
    // Clearing quadrant
    expect(computeCoveyDataPatch({ urgent: true, important: true, quadrant: 1 }, { quadrant: null })).toEqual({
      urgent: undefined,
      important: undefined,
      quadrant: undefined,
    });
    // Toggling importance on an unassigned item defaults urgency to false -> Q2
    const step1 = computeCoveyDataPatch({}, { important: true });
    expect(step1).toEqual({ urgent: false, important: true, quadrant: 2 });
    // Toggling urgency on that item moves it to Q1
    const step2 = computeCoveyDataPatch(step1, { urgent: true });
    expect(step2).toEqual({ urgent: true, important: true, quadrant: 1 });
    // Toggling importance off moves Q1 -> Q3
    const step3 = computeCoveyDataPatch(step2, { important: false });
    expect(step3).toEqual({ urgent: true, important: false, quadrant: 3 });
    // Toggling urgency off moves Q3 -> Q4
    const step4 = computeCoveyDataPatch(step3, { urgent: false });
    expect(step4).toEqual({ urgent: false, important: false, quadrant: 4 });
  });

  it('formats concise canvas badge labels', () => {
    expect(formatCoveyCanvasBadge(1)).toBe('Q1 · Urgent & Important');
    expect(formatCoveyCanvasBadge(2)).toBe('Q2 · Not Urgent & Important');
    expect(formatCoveyCanvasBadge(3)).toBe('Q3 · Urgent & Not Important');
    expect(formatCoveyCanvasBadge(4)).toBe('Q4 · Not Urgent & Not Important');
    expect(formatCoveyCanvasBadge(null)).toBe('');
  });
});

describe('Covey Matrix tree extraction & grouping', () => {
  it('partitions mind map items into Q1..Q4 and unassigned while skipping pure branch headers', () => {
    const tree = {
      data: { uid: 'root', text: 'Company Goals' },
      children: [
        {
          data: { uid: 'b-eng', text: 'Engineering' },
          children: [
            { data: { uid: 't-q1', text: 'Fix production outage', urgent: true, important: true }, children: [] },
            { data: { uid: 't-q2', text: 'Architecture design', quadrant: 2 }, children: [] },
            { data: { uid: 't-unassigned', text: 'Investigate caching' }, children: [] },
          ],
        },
        {
          data: { uid: 'b-ops', text: 'Operations' },
          children: [
            { data: { uid: 't-q3', text: 'Status email', urgent: true, important: false }, children: [] },
            { data: { uid: 't-q4', text: 'Reformat old wiki', urgent: false, important: false }, children: [] },
          ],
        },
        {
          data: { uid: 'b-empty', text: 'Standalone Idea' },
          children: [],
        },
      ],
    };

    const items = extractAllTasks(tree);
    const grouped = groupItemsByCoveyQuadrant(items);

    expect(grouped.quadrants[1].map((i) => i.uid)).toEqual(['t-q1']);
    expect(grouped.quadrants[2].map((i) => i.uid)).toEqual(['t-q2']);
    expect(grouped.quadrants[3].map((i) => i.uid)).toEqual(['t-q3']);
    expect(grouped.quadrants[4].map((i) => i.uid)).toEqual(['t-q4']);
    // b-eng and b-ops have children and no task/quadrant metadata so they are omitted from unassigned;
    // t-unassigned and childless b-empty appear in unassigned for triage.
    expect(grouped.unassigned.map((i) => i.uid)).toEqual(['t-unassigned', 'b-empty']);
    expect(grouped.counts).toEqual({
      q1: 1,
      q2: 1,
      q3: 1,
      q4: 1,
      assigned: 4,
      unassigned: 2,
    });
  });
});
