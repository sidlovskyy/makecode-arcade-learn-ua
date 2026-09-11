import type { ComparisonStepVisual } from '../lesson-visuals/types';
import { PythonExample } from './PythonExample';
import { VisualFigure } from './VisualFigure';

export function BlocksPythonComparison({ visual, eager }: { visual: ComparisonStepVisual; eager?: boolean }) {
  return <div>
    <div className="visual-comparison">
      <section><h3>Блоки</h3><VisualFigure {...visual.blocks} kind="blocks" eager={eager} /></section>
      <section><h3>Python</h3><PythonExample visual={visual.python} /></section>
    </div>
    <p>{visual.explanation}</p>
  </div>;
}
