import type { BlocksStepVisual } from '../lesson-visuals/types';
import { VisualFigure } from './VisualFigure';

export function BlockDiagram({ visual, eager }: { visual: BlocksStepVisual; eager?: boolean }) {
  return <VisualFigure {...visual} eager={eager} />;
}
