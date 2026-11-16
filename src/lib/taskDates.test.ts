import { describe, expect, it } from 'vitest';
import {
  addDaysToDateString,
  daysBetween,
  extractAllTasks,
  extractKanbanColumns,
  formatTaskDateBadge,
  getTaskDateStatus,
  isTaskOnDate,
  isValidDateString,
  isValidTimeString,
  minutesToTimeString,
  parseTimeToMinutes,
  rescheduleDatesOnto,
} from './taskDates';

describe('taskDates validation and formatting', () => {
  it('validates YYYY-MM-DD calendar dates', () => {
    expect(isValidDateString('2026-11-16')).toBe(true);
    expect(isValidDateString('2026-02-29')).toBe(false); // 2026 is not a leap year
    expect(isValidDateString('2024-02-29')).toBe(true);
    expect(isValidDateString('not-a-date')).toBe(false);
    expect(isValidDateString('')).toBe(false);
  });

  it('validates HH:mm 24-hour times', () => {
    expect(isValidTimeString('09:00')).toBe(true);
    expect(isValidTimeString('23:59')).toBe(true);
    expect(isValidTimeString('24:00')).toBe(false);
    expect(isValidTimeString('9:00')).toBe(false);
  });

  it('formats badges for single dates, ranges, and time blocks', () => {
    expect(formatTaskDateBadge({ startDate: '2026-11-16', endDate: '2026-11-16' }, 2026)).toBe('Nov 16');
    expect(
      formatTaskDateBadge(
        { startDate: '2026-11-16', endDate: '2026-11-16', startTime: '09:00', endTime: '10:30' },
        2026
      )
    ).toBe('Nov 16 · 09:00–10:30');
    expect(formatTaskDateBadge({ startDate: '2026-11-16', endDate: '2026-11-20' }, 2026)).toBe(
      'Nov 16 → Nov 20'
    );
    expect(formatTaskDateBadge({ endDate: '2026-11-20' }, 2026)).toBe('Due Nov 20');
    expect(formatTaskDateBadge({ startDate: '2026-11-16' }, 2026)).toBe('From Nov 16');
  });

  it('computes task schedule status relative to today', () => {
    const today = '2026-11-16';
    expect(getTaskDateStatus({ endDate: '2026-11-15' }, 0, today)).toBe('overdue');
    expect(getTaskDateStatus({ endDate: '2026-11-15' }, 100, today)).toBe('completed');
    expect(getTaskDateStatus({ startDate: '2026-11-14', endDate: '2026-11-18' }, 50, today)).toBe('today');
    expect(getTaskDateStatus({ startDate: '2026-11-18', endDate: '2026-11-18' }, 0, today)).toBe('upcoming');
    expect(getTaskDateStatus({ startDate: '2026-12-01', endDate: '2026-12-05' }, 0, today)).toBe('scheduled');
    expect(getTaskDateStatus({}, 0, today)).toBeNull();
  });

  it('treats a start-only date as open-ended, never overdue', () => {
    const today = '2026-11-16';
    expect(getTaskDateStatus({ startDate: '2026-11-10' }, 0, today)).toBe('scheduled');
    expect(getTaskDateStatus({ startDate: '2026-11-16' }, 0, today)).toBe('today');
    expect(getTaskDateStatus({ startDate: '2026-11-18' }, 0, today)).toBe('upcoming');
  });

  it('counts whole days between dates across month and DST boundaries', () => {
    expect(daysBetween('2026-11-16', '2026-11-20')).toBe(4);
    expect(daysBetween('2026-11-20', '2026-11-16')).toBe(-4);
    expect(daysBetween('2026-03-01', '2026-04-01')).toBe(31);
  });

  it('reschedules onto a date without losing a multi-day range', () => {
    // range already covers the target: unchanged
    expect(rescheduleDatesOnto({ startDate: '2026-11-16', endDate: '2026-11-20' }, '2026-11-18')).toEqual({
      startDate: '2026-11-16',
      endDate: '2026-11-20',
    });
    // range elsewhere: shifted to start on the target, same length
    expect(rescheduleDatesOnto({ startDate: '2026-11-01', endDate: '2026-11-03' }, '2026-11-16')).toEqual({
      startDate: '2026-11-16',
      endDate: '2026-11-18',
    });
    // single-day, start-only, or undated: becomes a single day on the target
    expect(rescheduleDatesOnto({ startDate: '2026-11-01', endDate: '2026-11-01' }, '2026-11-16')).toEqual({
      startDate: '2026-11-16',
      endDate: '2026-11-16',
    });
    expect(rescheduleDatesOnto({ startDate: '2026-11-01' }, '2026-11-16')).toEqual({
      startDate: '2026-11-16',
      endDate: '2026-11-16',
    });
    expect(rescheduleDatesOnto({}, '2026-11-16')).toEqual({ startDate: '2026-11-16', endDate: '2026-11-16' });
  });

  it('checks if a task falls on a specific date', () => {
    expect(isTaskOnDate({ startDate: '2026-11-15', endDate: '2026-11-17' }, '2026-11-16')).toBe(true);
    expect(isTaskOnDate({ startDate: '2026-11-15', endDate: '2026-11-17' }, '2026-11-18')).toBe(false);
    expect(isTaskOnDate({ endDate: '2026-11-16' }, '2026-11-16')).toBe(true);
  });

  it('converts between HH:mm and minutes', () => {
    expect(parseTimeToMinutes('09:30')).toBe(570);
    expect(minutesToTimeString(570)).toBe('09:30');
    expect(addDaysToDateString('2026-11-16', 5)).toBe('2026-11-21');
  });
});

describe('Kanban and Planner tree extraction', () => {
  const sampleTree = {
    data: { uid: 'root-1', text: 'Product Roadmap' },
    children: [
      {
        data: { uid: 'branch-1', text: 'Backlog' },
        children: [
          {
            data: {
              uid: 'task-1',
              text: '<p>Design Spec</p>',
              icon: ['priority_1', 'progress_50'],
              startDate: '2026-11-16',
              endDate: '2026-11-18',
              startTime: '09:00',
              endTime: '10:30',
              tag: ['UX'],
            },
            children: [
              {
                data: {
                  uid: 'subtask-1',
                  text: 'Review wireframes',
                  icon: ['progress_100'],
                },
                children: [],
              },
            ],
          },
        ],
      },
      {
        data: { uid: 'branch-2', text: 'In Review' },
        children: [],
      },
    ],
  };

  it('extracts first-level branches as Kanban columns and descendants as cards', () => {
    const cols = extractKanbanColumns(sampleTree);
    expect(cols).toHaveLength(2);
    expect(cols[0].uid).toBe('branch-1');
    expect(cols[0].title).toBe('Backlog');
    expect(cols[0].cards).toHaveLength(2);
    expect(cols[0].cards[0]).toMatchObject({
      uid: 'task-1',
      text: 'Design Spec',
      priority: 1,
      progress: 50,
      startDate: '2026-11-16',
      endDate: '2026-11-18',
      startTime: '09:00',
      endTime: '10:30',
      tags: ['UX'],
    });
    expect(cols[0].cards[1]).toMatchObject({
      uid: 'subtask-1',
      text: 'Review wireframes',
      parentText: 'Design Spec',
      depth: 3,
      progress: 100,
    });
    expect(cols[1].cards).toHaveLength(0);
  });

  it('extracts all non-root tasks for the Daily Planner', () => {
    const all = extractAllTasks(sampleTree);
    expect(all.map((t) => t.uid)).toEqual(['branch-1', 'task-1', 'subtask-1', 'branch-2']);
  });
});
