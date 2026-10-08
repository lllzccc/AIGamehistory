/**
 * 层 0、2 在轴线上方，层 1、3 在下方。偶数项优先上方，奇数项优先下方，
 * 与同层上一个标签的水平距离不足 minGap 时换到更外侧的层。
 */
export function assignLevels(xs: number[], minGap: number, levels = 4): number[] {
  const lastX = Array<number>(levels).fill(-Infinity);
  const upFirst = Array.from({ length: levels }, (_, i) => i);
  const downFirst = upFirst.map((i) => (i % 2 === 0 ? i + 1 : i - 1)).filter((i) => i < levels);

  return xs.map((x, index) => {
    const preference = index % 2 === 0 ? upFirst : downFirst;
    let level = preference.find((l) => x - lastX[l] >= minGap);
    if (level === undefined) level = lastX.indexOf(Math.min(...lastX));
    lastX[level] = x;
    return level;
  });
}
