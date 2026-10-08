import { describe, expect, it } from 'vitest';
import { assignLevels } from '../src/lib/timelineLayout';

describe('assignLevels', () => {
  it('间距足够时在轴线上下交替', () => {
    expect(assignLevels([0, 200, 400], 150)).toEqual([0, 1, 0]);
  });

  it('间距不足时依次使用更外侧的层', () => {
    expect(assignLevels([0, 50, 100, 120], 150)).toEqual([0, 1, 2, 3]);
  });

  it('所有层都被占用时回到最早空出的层', () => {
    expect(assignLevels([0, 10, 20, 30, 40], 150)).toEqual([0, 1, 2, 3, 0]);
  });
});
