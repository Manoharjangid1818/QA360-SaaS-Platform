// Cron expression utilities — validate, describe, compute next run

import cronstrue from 'cronstrue';

// ─── Validate ────────────────────────────────────────────────────────────────

export function validateCronExpression(expr: string): { valid: boolean; error?: string } {
  if (!expr || !expr.trim()) return { valid: false, error: 'Expression is required' };

  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) {
    return { valid: false, error: 'Must have exactly 5 fields: minute hour day month weekday' };
  }

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

    // Step values: */n or n/n
    if (part.includes('/')) {
      const [base, step] = part.split('/');
      const stepNum = parseInt(step, 10);
      if (isNaN(stepNum) || stepNum < 1) {
        return { valid: false, error: `Invalid step in ${name}` };
      }
      if (base !== '*' && (isNaN(parseInt(base, 10)))) {
        return { valid: false, error: `Invalid base in ${name}` };
      }
      continue;
    }

    // Range: n-m
    if (part.includes('-')) {
      const [a, b] = part.split('-').map(Number);
      if (isNaN(a) || isNaN(b) || a < min || b > max || a > b) {
        return { valid: false, error: `Invalid range in ${name} (${min}-${max})` };
      }
      continue;
    }

    // List: n,m,p
    if (part.includes(',')) {
      const nums = part.split(',').map(Number);
      if (nums.some((n) => isNaN(n) || n < min || n > max)) {
        return { valid: false, error: `Invalid value in ${name} list (${min}-${max})` };
      }
      continue;
    }

    // Plain number
    const num = parseInt(part, 10);
    if (isNaN(num) || num < min || num > max) {
      return { valid: false, error: `${name} must be between ${min} and ${max}` };
    }
  }

  return { valid: true };
}

// ─── Human-readable description ───────────────────────────────────────────────

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

// ─── Next run computation ─────────────────────────────────────────────────────

export function getNextRunDate(expr: string, fromDate: Date = new Date()): Date | null {
  if (!expr) return null;
  const { valid } = validateCronExpression(expr);
  if (!valid) return null;

  try {
    const [minute, hour, day, month, weekday] = expr.trim().split(/\s+/);
    const now = new Date(fromDate);
    now.setSeconds(0, 0);
    now.setMinutes(now.getMinutes() + 1); // start from next minute

    // Search forward up to 1 year
    for (let i = 0; i < 525600; i++) {
      if (matchesCron(now, { minute, hour, day, month, weekday })) {
        return new Date(now);
      }
      now.setMinutes(now.getMinutes() + 1);
    }
    return null;
  } catch {
    return null;
  }
}

function matchesCron(
  date: Date,
  parts: { minute: string; hour: string; day: string; month: string; weekday: string },
): boolean {
  const m = date.getMinutes();
  const h = date.getHours();
  const d = date.getDate();
  const mo = date.getMonth() + 1;
  const wd = date.getDay();

  return (
    matchField(parts.minute, m, 0, 59) &&
    matchField(parts.hour, h, 0, 23) &&
    matchField(parts.day, d, 1, 31) &&
    matchField(parts.month, mo, 1, 12) &&
    matchField(parts.weekday, wd, 0, 7)
  );
}

function matchField(field: string, value: number, min: number, max: number): boolean {
  if (field === '*' || field === '?') return true;

  if (field.includes('/')) {
    const [base, step] = field.split('/');
    const stepNum = parseInt(step, 10);
    const baseNum = base === '*' ? min : parseInt(base, 10);
    if ((value - baseNum) % stepNum === 0 && value >= baseNum) return true;
    return false;
  }

  if (field.includes('-')) {
    const [a, b] = field.split('-').map(Number);
    return value >= a && value <= b;
  }

  if (field.includes(',')) {
    return field.split(',').map(Number).includes(value);
  }

  const num = parseInt(field, 10);
  // Sunday can be 0 or 7
  if (num === 7 && value === 0) return true;
  return num === value;
}

// ─── Format next run ──────────────────────────────────────────────────────────

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
