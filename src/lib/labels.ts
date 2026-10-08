import type { Company, Product, TimelineKind } from './types';

export const companyKindLabel: Record<Company['kind'], string> = {
  independent: '独立公司',
  studio: '大厂工作室',
  platform: '平台',
};

export const companyStatusLabel: Record<Company['status'], string> = {
  active: '运营中',
  acquired: '已被收购',
  closed: '已关闭',
};

export const genreLabel: Record<Product['genre'], string> = {
  otome: '乙女',
  dressup: '换装',
  interactive: '互动叙事',
  other: '其他',
};

export const productStatusLabel: Record<Product['status'], string> = {
  live: '运营中',
  shutdown: '已停服',
};

export const timelineKindLabel: Record<TimelineKind, string> = {
  founded: '成立',
  launch: '上线',
  shutdown: '停服',
  funding: '融资',
  ipo: '上市',
  acquisition: '收购',
  rename: '更名',
  layoff: '裁员',
  controversy: '争议',
  milestone: '里程碑',
};
