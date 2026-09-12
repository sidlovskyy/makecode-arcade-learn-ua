import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { campaign01 } from '../curriculum/campaign-01';
import { StepNavigator } from './StepNavigator';

afterEach(cleanup);
it('C01-007: keeps every number when completed steps are reviewed', () => {
  const steps = campaign01.lessons[1]!.steps;
  render(<StepNavigator steps={steps} currentIndex={3} completedStepIds={new Set(steps.map(({ id }) => id))} onSelectStep={() => {}} />);
  steps.forEach((step, index) => {
    const button = screen.getByRole('button', { name: `Крок ${index + 1}: ${step.title}. Виконано` });
    expect(within(button).getByText(String(index + 1))).toBeVisible();
  });
});
