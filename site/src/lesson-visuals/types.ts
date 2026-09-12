export interface NormalizedRect {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

interface ExplainedVisual {
  explanation: string;
}

export interface BlocksStepVisual extends ExplainedVisual {
  kind: 'blocks';
  assetId: string;
  alt: string;
  focus: NormalizedRect;
  additionalFocus?: NormalizedRect[];
  action?: 'verify';
}

export interface EditorStepVisual extends ExplainedVisual {
  kind: 'editor';
  assetId: string;
  alt: string;
  focus: NormalizedRect;
}

export interface PythonStepVisual extends ExplainedVisual {
  kind: 'python';
  label: string;
  code: string;
}

export interface ComparisonStepVisual extends ExplainedVisual {
  kind: 'comparison';
  blocks: Omit<BlocksStepVisual, 'kind' | 'explanation'>;
  python: Pick<PythonStepVisual, 'label' | 'code'>;
}

export interface GuideStepVisual {
  kind: 'guide';
  title: string;
  items: [string, ...string[]];
  note?: string;
}

export type LessonStepVisual =
  | BlocksStepVisual
  | EditorStepVisual
  | PythonStepVisual
  | ComparisonStepVisual
  | GuideStepVisual;

export interface LessonVisualAsset {
  kind: 'blocks' | 'editor';
  src: string;
}

export type LessonVisualAssetRegistry = Readonly<Record<string, LessonVisualAsset>>;
