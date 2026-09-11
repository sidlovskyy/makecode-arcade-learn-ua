import type { LessonStepVisual } from '../lesson-visuals/types';
import { BlockDiagram } from './BlockDiagram';
import { BlocksPythonComparison } from './BlocksPythonComparison';
import { EditorScreenshot } from './EditorScreenshot';
import { GuideVisual } from './GuideVisual';
import { PythonExample } from './PythonExample';

export function StepVisual({ visual, eager = false }: { visual: LessonStepVisual; eager?: boolean }) {
  function renderVisual() {
    switch (visual.kind) {
      case 'blocks': return <BlockDiagram visual={visual} eager={eager} />;
      case 'editor': return <EditorScreenshot visual={visual} />;
      case 'python': return <PythonExample visual={visual} />;
      case 'comparison': return <BlocksPythonComparison visual={visual} eager={eager} />;
      case 'guide': return <GuideVisual visual={visual} />;
      default: {
        const exhaustive: never = visual;
        throw new Error(`Unknown visual: ${String(exhaustive)}`);
      }
    }
  }
  return <div className="step-visual">{renderVisual()}</div>;
}
