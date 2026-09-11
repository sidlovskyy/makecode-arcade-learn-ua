import type { GuideStepVisual } from '../lesson-visuals/types';

export function GuideVisual({ visual }: { visual: GuideStepVisual }) {
  return <div className="visual-guide"><h3>{visual.title}</h3><ol>{visual.items.map((item, index) => <li key={index}>{item}</li>)}</ol></div>;
}
