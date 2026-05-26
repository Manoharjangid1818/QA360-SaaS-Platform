import cronstrue from 'cronstrue';

export function validateCronExpression(expr: string): { valid: boolean; error?: string } {
  if (!expr || !expr.trim()) return { valid: false, error: 'Expression is required' };
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return { valid: false, error: 'Must have exactly 5 fields: minute hour day month weekday' };

  const ranges = [
    { name: 'minute', min: 0, max: 59 },
    { name: 'hour', min: 0, max: 23 },
    { name: 'day', min: 1, max: 31 },
    { name: 'month', min: 1, max: 12 },
    { name: 'weekday', min: 0, max: 7 },
  ];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const { name, min, max } = ranges[i];
    if (part === '*' || part === '?') continue;
    if (part.includes('/')) {
      const [base, step] = part.split('/');
      if (isNaN(parseInt(step, 10)) || parseInt(step, 10) < 1) return { valid: false, error: `Invalid step in ${name}` };
      if (base !== '*' && isNaN(parseInt(base, 10))) return { valid: false, error: `Invalid base in ${name}` };
      continue;
    }
    if (part.includes('-')) {
      const [a, b] = part.split('-').map(Number);
      if (isNaN(a) || isNaN(b) || a < min || b > max || a > b) return { valid: false, error: `Invalid range in ${name}` };
      continue;
    }
    if (part.includes(',')) {
      const nums = part.split(',').map(Number);
      if (nums.some((n) => isNaN(n) || n < min || n > max)) return { valid: false, error: `Invalid value in ${name} list` };
      continue;
    }
    const num = parseInt(part, 10);
    if (isNaN(num) || num < min || num > max) return { valid: false, error: `${name} must be between ${min} and ${max}` };
  }
  return { valid: true };
}

export function describeCron(expr: string): string {
  if (!expr) return '';
  const { valid } = validateCronExpression(expr);
  if (!valid) return 'Invalid expression';
  try {
    return cronstrue.toString(expr, { use24HourTimeFormat: true });
  } catch {
    return 'Custom schedule';
  }
}

export function formatNextRun(dateStr: string | null): string {
  if (!dateStr) return 'Not scheduled';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 0) return 'Overdue';
  if (diffMins < 1) return 'In less than a minute';
  if (diffMins < 60) return `In ${diffMins} minute${diffMins !== 1 ? 's' : ''}`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `In ${diffHrs} hour${diffHrs !== 1 ? 's' : ''}`;
  const diffDays = Math.floor(diffHrs / 24);
  return `In ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
}
