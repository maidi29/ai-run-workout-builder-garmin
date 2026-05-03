import { Exercise } from '../../types';

/** Determine workout step type from exercise name */
export function getStepType(exercise: Exercise): string {
  const name = exercise.name.toLowerCase();
  if (/warm\s*up/i.test(name)) return 'warmup';
  if (/cool\s*down/i.test(name)) return 'cooldown';
  if (/rest|pause|break/i.test(name)) return 'rest';
  if (/recovery/i.test(name)) return 'recovery';
  return 'interval';
}
