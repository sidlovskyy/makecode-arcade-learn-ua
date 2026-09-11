import type { EditorStepVisual } from '../lesson-visuals/types';
import { VisualFigure } from './VisualFigure';

export function EditorScreenshot({ visual }: { visual: EditorStepVisual }) {
  return <VisualFigure {...visual} />;
}
