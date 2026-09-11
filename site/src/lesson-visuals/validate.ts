import type {
  LessonStepVisual,
  LessonVisualAssetRegistry,
  NormalizedRect,
} from './types';

function validateRequiredString(
  stepId: string,
  field: string,
  value: string,
  errors: string[],
): void {
  if (!value.trim()) {
    errors.push(`${stepId} ${field} is required`);
  }
}

function validateFocus(
  stepId: string,
  field: string,
  focus: NormalizedRect,
  errors: string[],
): void {
  validateRequiredString(stepId, `${field}.label`, focus.label, errors);

  const coordinates = [focus.x, focus.y, focus.width, focus.height];
  const fitsNormalizedBounds =
    coordinates.every((value) => Number.isFinite(value) && value >= 0 && value <= 1) &&
    focus.x + focus.width <= 1 &&
    focus.y + focus.height <= 1;

  if (!fitsNormalizedBounds) {
    errors.push(`${stepId} ${field} must fit within normalized coordinates 0..1`);
  }
}

function validateAsset(
  stepId: string,
  field: string,
  assetId: string,
  expectedKind: 'blocks' | 'editor',
  assets: LessonVisualAssetRegistry,
  errors: string[],
): void {
  validateRequiredString(stepId, field, assetId, errors);
  if (!assetId.trim()) {
    return;
  }

  const asset = assets[assetId];
  if (!asset) {
    errors.push(`${stepId} ${field} "${assetId}" is not registered`);
  } else if (asset.kind !== expectedKind) {
    errors.push(`${stepId} ${field} "${assetId}" must reference a ${expectedKind} asset`);
  }
}

export function validateLessonVisual(
  stepId: string,
  visual: LessonStepVisual,
  assets: LessonVisualAssetRegistry,
): string[] {
  const errors: string[] = [];

  switch (visual.kind) {
    case 'blocks':
    case 'editor':
      validateRequiredString(stepId, 'alt', visual.alt, errors);
      validateRequiredString(stepId, 'explanation', visual.explanation, errors);
      validateAsset(stepId, 'assetId', visual.assetId, visual.kind, assets, errors);
      validateFocus(stepId, 'focus', visual.focus, errors);
      break;
    case 'python':
      validateRequiredString(stepId, 'label', visual.label, errors);
      validateRequiredString(stepId, 'code', visual.code, errors);
      validateRequiredString(stepId, 'explanation', visual.explanation, errors);
      break;
    case 'comparison':
      validateRequiredString(stepId, 'explanation', visual.explanation, errors);
      validateRequiredString(stepId, 'blocks.alt', visual.blocks.alt, errors);
      validateAsset(stepId, 'blocks.assetId', visual.blocks.assetId, 'blocks', assets, errors);
      validateFocus(stepId, 'blocks.focus', visual.blocks.focus, errors);
      validateRequiredString(stepId, 'python.label', visual.python.label, errors);
      validateRequiredString(stepId, 'python.code', visual.python.code, errors);
      break;
    case 'guide':
      validateRequiredString(stepId, 'guide title', visual.title, errors);
      if (visual.items.length === 0) {
        errors.push(`${stepId} guide items must not be empty`);
      }
      visual.items.forEach((item, index) => {
        validateRequiredString(stepId, `guide item ${index + 1}`, item, errors);
      });
      break;
  }

  return errors;
}
