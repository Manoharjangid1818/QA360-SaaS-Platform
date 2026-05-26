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

export const ACTION_LABELS: Record<ActionType, string> = {
  navigate: 'Navigate to URL',
  click: 'Click element',
  fill: 'Type text',
  select: 'Select option',
  check: 'Check checkbox',
  uncheck: 'Uncheck checkbox',
  hover: 'Hover over element',
  press: 'Press key',
  assertText: 'Assert text',
  assertVisible: 'Assert visible',
  assertURL: 'Assert URL',
  screenshot: 'Take screenshot',
  wait: 'Wait',
};
