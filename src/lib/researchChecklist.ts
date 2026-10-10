import type { Company } from './types';
export const researchDirections = [
  { area: 'history', title: '公司沿革', criterion: '核对官网全部历程、可获得的招股书与历年财报，记录主体、子公司及重大变动。' },
  { area: 'catalog', title: '产品全集', criterion: '交叉核对官网新旧产品页、财报、官方发行账号、商店与版号资料；发现的产品都有档案或暂不收录理由。' },
  { area: 'lifecycle', title: '产品生命周期', criterion: '逐项核对重点产品的测试、首发、地区版本、发行变更和停运，保留日期分歧及检索记录。' },
  { area: 'talent', title: '人员与团队', criterion: '逐项目检查官方署名、访谈、开发者交流、作品集及公开职业履历；记录姓名、职责、时间和证据。' },
  { area: 'business', title: '商业表现', criterion: '整理可获得的历年披露；区分公司营收、产品收入与第三方流水，注明期间、地区、平台及估算口径。' },
] as const;
export function hasDeepCoverage(checklist: Company['researchChecklist']): boolean {
  if (!checklist || checklist.items.length !== 5 || new Set(checklist.items.map(i => i.area)).size !== 5) return false;
  if (!checklist.items.every(i => i.status === 'reviewed')) return false;
  const rounds = checklist.supplementRounds.slice(-2);
  return rounds.length === 2 && rounds.every(r => !r.foundKeyFacts) && new Set(rounds.map(r => r.channel.trim())).size === 2;
}
