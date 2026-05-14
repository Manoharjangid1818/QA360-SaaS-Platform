// Playwright Code Generator — TypeScript types

export type CodeLanguage = 'playwright-js' | 'playwright-ts' | 'python';

export type ActionType =
  | 'navigate'
  | 'click'
  | 'fill'
  | 'select'
  | 'check'
  | 'uncheck'
  | 'hover'
  | 'press'
  | 'assertText'
  | 'assertVisible'
  | 'assertURL'
  | 'screenshot'
  | 'wait';

export type ElementType = 'button' | 'input' | 'link' | 'select' | 'textarea' | 'other';

export type SelectorType =
  | 'getByRole'
  | 'getByLabel'
  | 'getByPlaceholder'
  | 'getByText'
  | 'getByTestId'
  | 'css'
  | 'xpath';

export interface InteractiveElement {
  id: string;
  tag: string;
  type?: string;
  text?: string;
  placeholder?: string;
  label?: string;
  ariaLabel?: string;
  name?: string;
  dataTestId?: string;
  href?: string;
  classes: string[];
  selector: string;
  selectorType: SelectorType;
  isFlaky: boolean;
  flakyReason?: string;
  healingSuggestions: string[];
  elementType: ElementType;
  options?: string[];
}

export interface RecordedAction {
  id: string;
  type: ActionType;
  selector?: string;
  selectorType?: SelectorType;
  value?: string;
  description?: string;
  isFlaky?: boolean;
  healingSuggestion?: string;
}

export interface CodegenSession {
  id: string;
  url: string;
  elements: InteractiveElement[];
  createdAt: string;
}

export interface AnalyzeResult {
  sessionId: string;
  url: string;
  elements: InteractiveElement[];
  pageTitle: string;
  error?: string;
}

export const ACTION_LABELS: Record<ActionType, string> = {
  navigate: 'Navigate to URL',
  click: 'Click element',
  fill: 'Type text',
  select: 'Select option',
  check: 'Check checkbox',
  uncheck: 'Uncheck checkbox',
  hover: 'Hover element',
  press: 'Press key',
  assertText: 'Assert text content',
  assertVisible: 'Assert visible',
  assertURL: 'Assert page URL',
  screenshot: 'Take screenshot',
  wait: 'Wait (ms)',
};

export const ELEMENT_TYPE_ACTIONS: Record<ElementType, ActionType[]> = {
  button: ['click', 'assertVisible'],
  input: ['fill', 'assertVisible'],
  link: ['click', 'assertVisible'],
  select: ['select', 'assertVisible'],
  textarea: ['fill', 'assertVisible'],
  other: ['click', 'hover', 'assertVisible'],
};
