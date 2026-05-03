import { stepBarColors } from '../../theme';

export { stepBarColors as STEP_BAR_COLORS };

export const STEP_TYPES = [
  { key: 'warmup', label: 'Warm Up' },
  { key: 'run', label: 'Run' },
  { key: 'interval', label: 'Interval' },
  { key: 'recovery', label: 'Recovery' },
  { key: 'rest', label: 'Rest' },
  { key: 'cooldown', label: 'Cool Down' },
] as const;
