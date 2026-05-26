// Locator stability analyzer — prefers stable selectors, flags flaky ones

import type { InteractiveElement, SelectorType } from '@/types/codegen';

interface RawElement {
  tag: string;
  type?: string | null;
  text?: string | null;
  placeholder?: string | null;
  label?: string | null;
  ariaLabel?: string | null;
  elementId?: string | null;
  name?: string | null;
  dataTestId?: string | null;
  href?: string | null;
  classes: string[];
  elementType: InteractiveElement['elementType'];
  options?: string[];
}

// Patterns that indicate a fragile, auto-generated identifier
const FLAKY_ID_PATTERNS = [
  /^\d+$/,                          // Purely numeric
  /[a-f0-9]{8,}/i,                  // Hash-like strings
  /css-[\w\d]+/,                    // CSS-in-JS generated (e.g. Emotion)
  /sc-[\w\d]+/,                     // Styled-components
  /__[\w]+__[\w]+/,                 // BEM double-underscore with numbers
  /\d{4,}/,                         // Contains 4+ consecutive digits
];

const FLAKY_CLASS_PATTERNS = [
  /^css-/,
  /^sc-/,
  /MuiButton-\w+\d+/,
  /^jsx-\d+/,
  /_\w{5,}$/,                       // hashed suffix (e.g. tailwind purge artifacts)
];

export function isIdFlaky(id: string): boolean {
  return FLAKY_ID_PATTERNS.some((p) => p.test(id));
}

export function isClassFlaky(cls: string): boolean {
  return FLAKY_CLASS_PATTERNS.some((p) => p.test(cls));
}

export function analyzeLocatorStability(selector: string): { isFlaky: boolean; reason?: string } {
  if (selector.includes('xpath') || selector.startsWith('//')) {
    return { isFlaky: true, reason: 'XPath selectors break easily with DOM structure changes' };
  }
  if (/nth-child|nth-of-type|\[\d+\]/.test(selector)) {
    return { isFlaky: true, reason: 'Positional selectors are order-dependent and brittle' };
  }
  const idMatch = selector.match(/#([\w-]+)/);
  if (idMatch && isIdFlaky(idMatch[1])) {
    return { isFlaky: true, reason: 'ID appears to be dynamically generated and may change' };
  }
  const classMatch = selector.match(/\.([\w-]+)/g);
  if (classMatch?.some((c) => isClassFlaky(c.slice(1)))) {
    return { isFlaky: true, reason: 'Class name appears auto-generated (CSS-in-JS or hashed)' };
  }
  return { isFlaky: false };
}

export function buildBestSelector(el: RawElement): {
  selector: string;
  selectorType: SelectorType;
  isFlaky: boolean;
  flakyReason?: string;
  healingSuggestions: string[];
} {
  const suggestions: string[] = [];

  // 1. data-testid (most stable)
  if (el.dataTestId) {
    return {
      selector: `page.getByTestId('${el.dataTestId}')`,
      selectorType: 'getByTestId',
      isFlaky: false,
      healingSuggestions: [],
    };
  }

  // 2. aria-label / label
  if (el.ariaLabel) {
    const s = `page.getByLabel('${sanitize(el.ariaLabel)}')`;
    if (el.text) suggestions.push(`page.getByText('${sanitize(el.text)}')`);
    return { selector: s, selectorType: 'getByLabel', isFlaky: false, healingSuggestions: suggestions };
  }
  if (el.label) {
    const s = `page.getByLabel('${sanitize(el.label)}')`;
    if (el.placeholder) suggestions.push(`page.getByPlaceholder('${sanitize(el.placeholder)}')`);
    return { selector: s, selectorType: 'getByLabel', isFlaky: false, healingSuggestions: suggestions };
  }

  // 3. placeholder (inputs)
  if (el.placeholder) {
    return {
      selector: `page.getByPlaceholder('${sanitize(el.placeholder)}')`,
      selectorType: 'getByPlaceholder',
      isFlaky: false,
      healingSuggestions: [],
    };
  }

  // 4. getByRole with name (buttons, links)
  if (el.text && (el.tag === 'button' || el.tag === 'a' || el.type === 'submit' || el.type === 'button')) {
    const role = el.tag === 'a' ? 'link' : 'button';
    if (el.elementId && !isIdFlaky(el.elementId)) {
      suggestions.push(`page.locator('#${el.elementId}')`);
    }
    return {
      selector: `page.getByRole('${role}', { name: '${sanitize(el.text)}' })`,
      selectorType: 'getByRole',
      isFlaky: false,
      healingSuggestions: suggestions,
    };
  }

  // 5. getByText (generic readable text)
  if (el.text && el.text.length < 60) {
    return {
      selector: `page.getByText('${sanitize(el.text)}')`,
      selectorType: 'getByText',
      isFlaky: false,
      healingSuggestions: [],
    };
  }

  // 6. name attribute
  if (el.name) {
    return {
      selector: `page.locator('[name="${el.name}"]')`,
      selectorType: 'css',
      isFlaky: false,
      healingSuggestions: [],
    };
  }

  // 7. Non-flaky ID
  if (el.elementId && !isIdFlaky(el.elementId)) {
    return {
      selector: `page.locator('#${el.elementId}')`,
      selectorType: 'css',
      isFlaky: false,
      healingSuggestions: [],
    };
  }

  // 8. Flaky fallback
  const fallbackSelector = el.elementId
    ? `page.locator('#${el.elementId}')`
    : `page.locator('${el.tag}')`;

  const { isFlaky, reason } = analyzeLocatorStability(fallbackSelector);

  if (el.text) suggestions.push(`page.getByText('${sanitize(el.text)}')`);
  suggestions.push(`page.locator('[data-testid="your-test-id"]') // add data-testid to element`);

  return {
    selector: fallbackSelector,
    selectorType: 'css',
    isFlaky: el.elementId ? isFlaky || isIdFlaky(el.elementId) : true,
    flakyReason: el.elementId && isIdFlaky(el.elementId)
      ? 'ID appears to be dynamically generated'
      : reason,
    healingSuggestions: suggestions,
  };
}

export function enrichElement(raw: RawElement, index: number): InteractiveElement {
  const { selector, selectorType, isFlaky, flakyReason, healingSuggestions } = buildBestSelector(raw);
  return {
    id: `el-${index}-${Date.now()}`,
    tag: raw.tag,
    type: raw.type ?? undefined,
    text: raw.text ?? undefined,
    placeholder: raw.placeholder ?? undefined,
    label: raw.label ?? undefined,
    ariaLabel: raw.ariaLabel ?? undefined,
    name: raw.name ?? undefined,
    dataTestId: raw.dataTestId ?? undefined,
    href: raw.href ?? undefined,
    classes: raw.classes,
    selector,
    selectorType,
    isFlaky,
    flakyReason,
    healingSuggestions,
    elementType: raw.elementType,
    options: raw.options,
  };
}

function sanitize(str: string): string {
  return str.replace(/'/g, "\\'").replace(/\n/g, ' ').trim();
}
