import type { Company, OrgUnitKind, PersonTitle, Product, RevenueBasis, Role, TimelineKind } from './types';

export const revenueBasisLabel: Record<RevenueBasis, string> = {
  store: '应用商店口径',
  'all-platform': '全平台估算',
  'official-report': '官方财报',
};

export const orgUnitKindLabel: Record<OrgUnitKind, string> = {
  'business-group': '事业群',
  'studio-group': '工作室群',
  studio: '工作室',
  'project-team': '项目组',
  'middle-platform': '中台',
  'publisher-brand': '发行品牌',
  branch: '分支机构',
  subsidiary: '子公司 / 法人',
};

export const companyKindLabel: Record<Company['kind'], string> = {
  independent: '独立公司',
  studio: '大厂工作室',
  platform: '平台',
};

export const companyStatusLabel: Record<Company['status'], string> = {
  active: '运营中',
  acquired: '已被收购',
  closed: '已关闭',
  unknown: '现状待核实',
};

export const genreLabel: Record<Product['genre'], string> = {
  otome: '乙女',
  dressup: '换装',
  palace: '宫斗',
  court: '官斗',
  interactive: '互动叙事',
  strategy: 'SLG策略',
  rpg: 'RPG角色扮演',
  other: '其他',
};

export const productStatusLabel: Record<Product['status'], string> = {
  live: '运营中',
  shutdown: '已停服',
  unknown: '版本现状待核实',
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
  departure: '离职',
  controversy: '争议',
  milestone: '里程碑',
};

export const personTitleLabel: Record<PersonTitle, string> = {
  founder: '创始人',
  chair: '董事长',
  ceo: 'CEO',
  president: '总裁',
  producer: '制作人',
  'executive-producer': '执行制作人',
  'creative-director': '制作人总监',
  'lead-designer': '主策',
  'core-designer': '核心策划',
  'lead-artist': '主美',
  'core-artist': '核心美术',
  writer: '编剧',
  music: '音乐',
  other: '其他',
};

export const CREDIT_TITLE_ORDER: PersonTitle[] = [
  'producer',
  'executive-producer',
  'creative-director',
  'lead-designer',
  'core-designer',
  'lead-artist',
  'core-artist',
  'writer',
  'music',
  'other',
];

export function roleStatusLabel(role: Role): string {
  if (role.status === 'active') return '在任已确认';
  if (role.status === 'departed' || role.to) return '已离任';
  return '状态未知';
}
export function rolePeriodLabel(role: Role): string {
  const start = role.dateBasis === 'public-observation' ? '公开记录始于 ' + role.from : role.from;
  return start + ' — ' + (role.to ?? (role.status === 'active' ? '在任' : '结束时间未知'));
}

export function displayRoleTitle(role: Role): string {
  const note = role.titleNote?.trim();
  return note || personTitleLabel[role.title];
}
