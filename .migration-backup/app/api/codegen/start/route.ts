// POST /api/codegen/start
// Launches a headless Playwright browser, visits the target URL,
// extracts all interactive elements with stable selectors, and returns them.

import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';
import { createSession } from '@/lib/codegen-session-store';
import { enrichElement } from '@/lib/locator-analyzer';
import type { InteractiveElement } from '@/types/codegen';

// ── Resolve Chromium executable at module load time ──────────────────────────

function resolveChromiumPath(): string | undefined {
  // 1. Use custom path if provided via environment variable
  const customPath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  if (customPath) {
    try {
      const { existsSync } = require('fs') as typeof import('fs');
      if (existsSync(customPath)) return customPath;
    } catch {}
  }

  // 2. Use system chromium
  try {
    const path = execSync('which chromium-browser 2>/dev/null || which chromium 2>/dev/null', {
      timeout: 3000,
      encoding: 'utf8',
    }).trim();
    if (path) return path;
  } catch {}

  return undefined;
}

const CHROMIUM_EXECUTABLE = resolveChromiumPath();

export async function POST(req: NextRequest) {
  let url: string;

  try {
    const body = await req.json();
    url = body.url?.trim();
    if (!url) {
      return NextResponse.json({ error: 'URL is required.' }, { status: 400 });
    }
    if (!/^https?:\/\/.+/.test(url)) {
      url = `https://${url}`;
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  try {
    const { chromium } = await import('playwright');

    const launchOptions: Parameters<typeof chromium.launch>[0] = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-extensions',
        '--single-process',
      ],
    };

    if (CHROMIUM_EXECUTABLE) {
      launchOptions.executablePath = CHROMIUM_EXECUTABLE;
    }

    const browser = await chromium.launch(launchOptions);

    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 800 },
    });

    const page = await context.newPage();

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(800);
    } catch (navErr: unknown) {
      await browser.close();
      const msg = navErr instanceof Error ? navErr.message : String(navErr);
      return NextResponse.json(
        { error: `Could not load "${url}". ${msg.slice(0, 150)}` },
        { status: 422 },
      );
    }

    const pageTitle = await page.title().catch(() => url);

    // ── Extract interactive elements from the DOM ──────────────────────────
    type RawEl = {
      tag: string;
      type: string | null;
      text: string | null;
      placeholder: string | null;
      label: string | null;
      ariaLabel: string | null;
      elementId: string | null;
      name: string | null;
      dataTestId: string | null;
      href: string | null;
      classes: string[];
      elementType: string;
      options?: string[];
    };

    const rawElements: RawEl[] = await page.evaluate(() => {
      const results: RawEl[] = [];

      function getLabel(el: Element): string | null {
        const id = el.id;
        if (id) {
          const lbl = document.querySelector(`label[for="${id}"]`);
          if (lbl) return lbl.textContent?.trim() || null;
        }
        const closest = el.closest('label');
        if (closest) return closest.textContent?.trim() || null;
        const labelledBy = el.getAttribute('aria-labelledby');
        if (labelledBy) {
          return document.getElementById(labelledBy)?.textContent?.trim() || null;
        }
        return null;
      }

      function getTestId(el: Element): string | null {
        return (
          el.getAttribute('data-testid') ||
          el.getAttribute('data-test-id') ||
          el.getAttribute('data-cy') ||
          el.getAttribute('data-test') ||
          null
        );
      }

      // Buttons
      document
        .querySelectorAll<HTMLElement>(
          'button, [role="button"], input[type="button"], input[type="submit"]',
        )
        .forEach((el) => {
          const text = (el.textContent?.trim() || el.getAttribute('value') || '').slice(0, 60);
          if (!text && !el.getAttribute('aria-label')) return;
          results.push({
            tag: el.tagName.toLowerCase(),
            type: el.getAttribute('type'),
            text: text || null,
            placeholder: null,
            label: getLabel(el),
            ariaLabel: el.getAttribute('aria-label'),
            elementId: el.id || null,
            name: el.getAttribute('name'),
            dataTestId: getTestId(el),
            href: null,
            classes: Array.from(el.classList),
            elementType: 'button',
          });
        });

      // Inputs
      document
        .querySelectorAll<HTMLInputElement>(
          'input:not([type="hidden"]):not([type="button"]):not([type="submit"]):not([type="reset"]), textarea',
        )
        .forEach((el) => {
          results.push({
            tag: el.tagName.toLowerCase(),
            type: el.getAttribute('type'),
            text: null,
            placeholder: el.placeholder || null,
            label: getLabel(el),
            ariaLabel: el.getAttribute('aria-label'),
            elementId: el.id || null,
            name: el.getAttribute('name'),
            dataTestId: getTestId(el),
            href: null,
            classes: Array.from(el.classList),
            elementType:
              el.tagName.toLowerCase() === 'textarea' ? 'textarea' : 'input',
          });
        });

      // Links
      document.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((el) => {
        const text = el.textContent?.trim().slice(0, 60);
        if (!text) return;
        const href = el.getAttribute('href') || '';
        if (href.startsWith('javascript:')) return;
        results.push({
          tag: 'a',
          type: null,
          text,
          placeholder: null,
          label: null,
          ariaLabel: el.getAttribute('aria-label'),
          elementId: el.id || null,
          name: null,
          dataTestId: getTestId(el),
          href,
          classes: Array.from(el.classList),
          elementType: 'link',
        });
      });

      // Selects
      document.querySelectorAll<HTMLSelectElement>('select').forEach((el) => {
        results.push({
          tag: 'select',
          type: null,
          text: null,
          placeholder: null,
          label: getLabel(el),
          ariaLabel: el.getAttribute('aria-label'),
          elementId: el.id || null,
          name: el.getAttribute('name'),
          dataTestId: getTestId(el),
          href: null,
          classes: Array.from(el.classList),
          elementType: 'select',
          options: Array.from(el.options)
            .map((o) => o.value)
            .filter(Boolean)
            .slice(0, 8),
        });
      });

      return results;
    });

    await browser.close();

    // Deduplicate and enrich
    const seen = new Set<string>();
    const elements: InteractiveElement[] = [];

    for (let i = 0; i < rawElements.length; i++) {
      const raw = rawElements[i];
      const key = `${raw.elementType}:${raw.text ?? ''}:${raw.ariaLabel ?? ''}:${raw.placeholder ?? ''}:${raw.elementId ?? ''}:${raw.name ?? ''}`;
      if (seen.has(key)) continue;
      seen.add(key);
      elements.push(
        enrichElement(
          {
            tag: raw.tag,
            type: raw.type ?? undefined,
            text: raw.text ?? undefined,
            placeholder: raw.placeholder ?? undefined,
            label: raw.label ?? undefined,
            ariaLabel: raw.ariaLabel ?? undefined,
            elementId: raw.elementId ?? undefined,
            name: raw.name ?? undefined,
            dataTestId: raw.dataTestId ?? undefined,
            href: raw.href ?? undefined,
            classes: raw.classes,
            elementType: raw.elementType as InteractiveElement['elementType'],
            options: raw.options,
          },
          i,
        ),
      );
    }

    // Store session
    const sessionId = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    createSession({
      id: sessionId,
      url,
      elements,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ sessionId, url, elements, pageTitle });
  } catch (err: unknown) {
    console.error('POST /api/codegen/start error:', err);
    const message = err instanceof Error ? err.message : 'Failed to analyze URL.';

    // Surface helpful error for browser not found
    const isNotFound =
      message.includes('executable') ||
      message.includes('not found') ||
      message.includes('ENOENT');

    return NextResponse.json(
      {
        error: isNotFound
          ? 'Browser not available in this environment. Please ensure Chromium is installed.'
          : message,
      },
      { status: 500 },
    );
  }
}
