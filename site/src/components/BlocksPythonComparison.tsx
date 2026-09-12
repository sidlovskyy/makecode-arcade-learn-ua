import { useState } from 'react';
import type { ComparisonStepVisual, LessonVisualAssetRegistry } from '../lesson-visuals/types';
import { PythonExample } from './PythonExample';
import { VisualFigure } from './VisualFigure';
import { lessonVisualAssets } from '../lesson-visuals/generated-assets';

function FocusedBlocks({ blocks }: { blocks: ComparisonStepVisual['blocks'] }) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const registry: LessonVisualAssetRegistry = lessonVisualAssets;
  const asset = Object.hasOwn(registry, blocks.assetId) ? registry[blocks.assetId] : undefined;
  if (asset?.kind !== 'blocks') return null;
  const f = blocks.focus;
  return <>
    <p>Виділені блоки: прокручуй область, щоб прочитати всі підписи.</p>
    <div className="visual-focused-blocks" role="region" aria-label="Виділені блоки у читабельному розмірі" tabIndex={0}>
      <div style={{ position: 'relative', overflow: 'hidden', width: size.width * f.width, height: size.height * f.height }}>
        <img src={asset.src} alt={blocks.alt} onLoad={event => setSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })}
          style={{ position: 'absolute', width: size.width || 'auto', maxWidth: 'none', left: -size.width * f.x, top: -size.height * f.y }} />
      </div>
    </div>
  </>;
}

export function BlocksPythonComparison({ visual, eager }: { visual: ComparisonStepVisual; eager?: boolean }) {
  return <div>
    <div className={`visual-comparison${visual.focusedPreview ? ' visual-comparison--focused' : ''}`}>
      <section><h3>Блоки</h3>{visual.focusedPreview && <FocusedBlocks blocks={visual.blocks} />}<VisualFigure {...visual.blocks} kind="blocks" eager={eager} /></section>
      <section><h3>Python</h3><PythonExample visual={visual.python} /></section>
    </div>
    <p>{visual.explanation}</p>
  </div>;
}
