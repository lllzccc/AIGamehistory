import type { Product } from '../lib/types';
import { coreGameplayLabels, fusionGameplayLabels } from '../lib/gameplay';
export default function GameplayTags({product}: {product: Product}) {
  if (!(product.chronicles ?? []).includes('slg')) return null;
  const labels = [product.gameplay?.core ? coreGameplayLabels[product.gameplay.core] : '核心玩法待分类', ...(product.gameplay?.fusion ?? []).map(f => fusionGameplayLabels[f])];
  return <span className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs leading-5 text-rouge" aria-label="玩法标签">{labels.map(label => <span key={label}>{label}</span>)}</span>;
}
