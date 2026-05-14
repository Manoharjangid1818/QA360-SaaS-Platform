// PDF generation using PDFKit for QA360 Enterprise Reports

import PDFDocument from 'pdfkit';
import type { ReportType, ReportFilters, BrandingSettings, DEFAULT_BRANDING } from '@/types/reports';
import {
  getTestExecutionData,
  getBugSummaryData,
  getPerformanceData,
  getRegressionData,
  getReleaseReadinessData,
} from './report-data';

type Branding = typeof DEFAULT_BRANDING;

const BLUE = '#2563eb';
const DARK = '#1e293b';
const GRAY = '#64748b';
const LIGHT_GRAY = '#f1f5f9';
const GREEN = '#16a34a';
const RED = '#dc2626';
const YELLOW = '#d97706';
const WHITE = '#ffffff';

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function addHeader(doc: PDFKit.PDFDocument, title: string, subtitle: string, branding: Branding) {
  const [r, g, b] = hexToRgb(branding.primaryColor);
  doc.rect(0, 0, doc.page.width, 80).fill(`rgb(${r},${g},${b})`);
  doc.fillColor(WHITE).fontSize(22).font('Helvetica-Bold')
    .text(branding.logoText, 40, 22);
  doc.fillColor(WHITE).fontSize(10).font('Helvetica')
    .text('Enterprise Test Management Platform', 40, 48);

  doc.fillColor(WHITE).fontSize(14).font('Helvetica-Bold')
    .text(title, 300, 20, { align: 'right', width: doc.page.width - 340 });
  doc.fillColor('rgba(255,255,255,0.8)').fontSize(9).font('Helvetica')
    .text(subtitle, 300, 42, { align: 'right', width: doc.page.width - 340 });

  doc.moveDown(4);
}

function addWatermark(doc: PDFKit.PDFDocument, text: string) {
  doc.save();
  doc.opacity(0.06);
  doc.fillColor(DARK).fontSize(72).font('Helvetica-Bold');
  const x = doc.page.width / 2 - 150;
  const y = doc.page.height / 2 - 40;
  doc.rotate(-45, { origin: [doc.page.width / 2, doc.page.height / 2] });
  doc.text(text, x - 60, y, { width: 400, align: 'center' });
  doc.restore();
}

function addFooter(doc: PDFKit.PDFDocument, branding: Branding, pageNum: number) {
  const y = doc.page.height - 40;
  doc.rect(0, y - 10, doc.page.width, 50).fill(LIGHT_GRAY);
  doc.fillColor(GRAY).fontSize(8).font('Helvetica')
    .text(branding.footerText, 40, y, { width: doc.page.width - 120 });
  doc.fillColor(GRAY).fontSize(8).font('Helvetica')
    .text(`Page ${pageNum}`, doc.page.width - 80, y, { align: 'right', width: 60 });
}

function sectionTitle(doc: PDFKit.PDFDocument, title: string) {
  doc.moveDown(0.5);
  const [r, g, b] = hexToRgb(BLUE);
  doc.rect(40, doc.y, doc.page.width - 80, 28).fill(`rgb(${r},${g},${b})`);
  doc.fillColor(WHITE).fontSize(11).font('Helvetica-Bold')
    .text(title.toUpperCase(), 50, doc.y - 20);
  doc.moveDown(1.2);
  doc.fillColor(DARK);
}

function metricRow(doc: PDFKit.PDFDocument, label: string, value: string, color?: string) {
  const y = doc.y;
  doc.fillColor(GRAY).fontSize(9).font('Helvetica').text(label, 50, y, { width: 200 });
  doc.fillColor(color || DARK).fontSize(9).font('Helvetica-Bold')
    .text(value, 260, y, { width: 200 });
  doc.moveDown(0.6);
}

function tableHeader(doc: PDFKit.PDFDocument, cols: { label: string; width: number }[]) {
  const y = doc.y;
  doc.rect(40, y, doc.page.width - 80, 22).fill(LIGHT_GRAY);
  let x = 50;
  cols.forEach(({ label, width }) => {
    doc.fillColor(DARK).fontSize(9).font('Helvetica-Bold').text(label, x, y + 6, { width, lineBreak: false });
    x += width;
  });
  doc.moveDown(1.4);
}

function tableRow(doc: PDFKit.PDFDocument, cols: { label: string; width: number }[], values: string[], rowIdx: number) {
  const y = doc.y;
  if (rowIdx % 2 === 1) {
    doc.rect(40, y - 2, doc.page.width - 80, 20).fill('#f8fafc');
  }
  let x = 50;
  cols.forEach(({ width }, i) => {
    const val = values[i] || '';
    let color = DARK;
    if (val === 'passed' || val === 'ready' || val === 'PASS') color = GREEN;
    if (val === 'failed' || val === 'blocked' || val === 'FAIL') color = RED;
    if (val === 'critical') color = RED;
    if (val === 'high') color = YELLOW;
    doc.fillColor(color).fontSize(8.5).font('Helvetica').text(val, x, y + 2, { width: width - 4, lineBreak: false });
    x += width;
  });
  doc.moveDown(1.1);
}

function summaryBox(doc: PDFKit.PDFDocument, metrics: { label: string; value: string; color?: string }[]) {
  const startY = doc.y;
  const boxW = (doc.page.width - 80) / metrics.length - 6;
  let x = 40;
  metrics.forEach(({ label, value, color }) => {
    doc.rect(x, startY, boxW, 56).fill(LIGHT_GRAY).stroke('#e2e8f0');
    doc.fillColor(color || BLUE).fontSize(20).font('Helvetica-Bold')
      .text(value, x + 4, startY + 8, { width: boxW - 8, align: 'center' });
    doc.fillColor(GRAY).fontSize(8).font('Helvetica')
      .text(label, x + 4, startY + 36, { width: boxW - 8, align: 'center' });
    x += boxW + 6;
  });
  doc.moveDown(4.5);
}

export async function generatePDF(type: ReportType, filters: ReportFilters, branding: Branding): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const now = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    let pageNum = 1;

    function newPage() {
      doc.addPage();
      pageNum++;
      if (branding.showWatermark) addWatermark(doc, branding.watermark);
      addFooter(doc, branding, pageNum);
    }

    switch (type) {
      case 'test_execution': {
        const data = getTestExecutionData(filters);
        addHeader(doc, 'Test Execution Report', `Generated ${now} · ${filters.environment || 'All Environments'}`, branding);
        if (branding.showWatermark) addWatermark(doc, branding.watermark);
        addFooter(doc, branding, pageNum);

        sectionTitle(doc, 'Executive Summary');
        summaryBox(doc, [
          { label: 'Total Tests', value: String(data.summary.total) },
          { label: 'Passed', value: String(data.summary.passed), color: GREEN },
          { label: 'Failed', value: String(data.summary.failed), color: RED },
          { label: 'Skipped', value: String(data.summary.skipped), color: YELLOW },
          { label: 'Pass Rate', value: `${data.summary.passRate}%`, color: data.summary.passRate >= 90 ? GREEN : data.summary.passRate >= 70 ? YELLOW : RED },
        ]);

        sectionTitle(doc, 'Test Run History');
        const runCols = [
          { label: 'Run Name', width: 175 },
          { label: 'Total', width: 55 },
          { label: 'Passed', width: 60 },
          { label: 'Failed', width: 55 },
          { label: 'Duration', width: 70 },
          { label: 'Date', width: 90 },
        ];
        tableHeader(doc, runCols);
        data.runs.forEach((r, i) => tableRow(doc, runCols, [r.name, String(r.total), String(r.passed), String(r.failed), r.duration, r.date], i));

        newPage();
        sectionTitle(doc, 'Test Case Details');
        const tcCols = [
          { label: 'Title', width: 255 },
          { label: 'Priority', width: 80 },
          { label: 'Status', width: 80 },
          { label: 'Updated', width: 90 },
        ];
        tableHeader(doc, tcCols);
        data.testCases.forEach((tc, i) => tableRow(doc, tcCols, [tc.title, tc.priority, tc.status, tc.updatedAt], i));

        sectionTitle(doc, 'Pass/Fail Trend (Last 7 Days)');
        const trendCols = [{ label: 'Date', width: 100 }, { label: 'Passed', width: 100 }, { label: 'Failed', width: 100 }];
        tableHeader(doc, trendCols);
        data.trend.forEach((t, i) => tableRow(doc, trendCols, [t.date, String(t.passed), String(t.failed)], i));
        break;
      }

      case 'bug_summary': {
        const data = getBugSummaryData(filters);
        addHeader(doc, 'Bug Summary Report', `Generated ${now} · ${filters.environment || 'All Environments'}`, branding);
        if (branding.showWatermark) addWatermark(doc, branding.watermark);
        addFooter(doc, branding, pageNum);

        sectionTitle(doc, 'Executive Summary');
        summaryBox(doc, [
          { label: 'Total Bugs', value: String(data.summary.total) },
          { label: 'Open', value: String(data.summary.open), color: RED },
          { label: 'In Progress', value: String(data.summary.inProgress), color: YELLOW },
          { label: 'Resolved', value: String(data.summary.resolved), color: GREEN },
          { label: 'Critical', value: String(data.summary.critical), color: RED },
        ]);

        sectionTitle(doc, 'Severity Distribution');
        const sevCols = [{ label: 'Severity', width: 150 }, { label: 'Count', width: 100 }];
        tableHeader(doc, sevCols);
        data.bySeverity.forEach((s, i) => tableRow(doc, sevCols, [s.severity, String(s.count)], i));

        doc.moveDown();
        sectionTitle(doc, 'Status Breakdown');
        const statusCols = [{ label: 'Status', width: 150 }, { label: 'Count', width: 100 }];
        tableHeader(doc, statusCols);
        data.byStatus.forEach((s, i) => tableRow(doc, statusCols, [s.status, String(s.count)], i));

        newPage();
        sectionTitle(doc, 'Bug Details');
        const bugCols = [
          { label: 'Title', width: 220 },
          { label: 'Severity', width: 80 },
          { label: 'Status', width: 80 },
          { label: 'Created', width: 80 },
        ];
        tableHeader(doc, bugCols);
        data.bugs.forEach((b, i) => tableRow(doc, bugCols, [b.title, b.severity, b.status, b.createdAt], i));
        break;
      }

      case 'performance': {
        const data = getPerformanceData(filters);
        addHeader(doc, 'Performance Report', `Generated ${now} · Lighthouse Audit Results`, branding);
        if (branding.showWatermark) addWatermark(doc, branding.watermark);
        addFooter(doc, branding, pageNum);

        sectionTitle(doc, 'Core Web Vitals Summary');
        summaryBox(doc, [
          { label: 'Lighthouse', value: `${data.summary.avgLighthouse}/100`, color: data.summary.avgLighthouse >= 90 ? GREEN : YELLOW },
          { label: 'FCP (s)', value: String(data.summary.avgFCP) },
          { label: 'LCP (s)', value: String(data.summary.avgLCP) },
          { label: 'CLS', value: String(data.summary.avgCLS), color: GREEN },
          { label: 'TTFB (s)', value: String(data.summary.avgTTFB), color: GREEN },
        ]);

        sectionTitle(doc, 'Lighthouse Scores by Page');
        const perfCols = [
          { label: 'Page', width: 120 },
          { label: 'Performance', width: 90 },
          { label: 'Accessibility', width: 90 },
          { label: 'Best Practices', width: 90 },
          { label: 'SEO', width: 70 },
        ];
        tableHeader(doc, perfCols);
        data.scores.forEach((s, i) => tableRow(doc, perfCols, [
          s.page,
          `${s.performance}/100`,
          `${s.accessibility}/100`,
          `${s.bestPractices}/100`,
          `${s.seo}/100`,
        ], i));
        break;
      }

      case 'regression': {
        const data = getRegressionData(filters);
        addHeader(doc, 'Regression Report', `Generated ${now} · Full Regression Suite`, branding);
        if (branding.showWatermark) addWatermark(doc, branding.watermark);
        addFooter(doc, branding, pageNum);

        sectionTitle(doc, 'Executive Summary');
        summaryBox(doc, [
          { label: 'Total Tests', value: String(data.summary.total) },
          { label: 'Passed', value: String(data.summary.passed), color: GREEN },
          { label: 'Failed', value: String(data.summary.failed), color: RED },
          { label: 'New Failures', value: String(data.summary.newFailures), color: data.summary.newFailures > 0 ? RED : GREEN },
          { label: 'Flaky', value: String(data.summary.flaky), color: YELLOW },
        ]);

        sectionTitle(doc, 'Suite Results');
        const suiteCols = [
          { label: 'Suite Name', width: 180 },
          { label: 'Total', width: 60 },
          { label: 'Passed', width: 65 },
          { label: 'Failed', width: 65 },
          { label: 'Duration', width: 80 },
        ];
        tableHeader(doc, suiteCols);
        data.suites.forEach((s, i) => tableRow(doc, suiteCols, [s.name, String(s.total), String(s.passed), String(s.failed), s.duration], i));

        doc.moveDown(0.5);
        sectionTitle(doc, 'Failures Requiring Attention');
        const failCols = [
          { label: 'Test Name', width: 180 },
          { label: 'Suite', width: 120 },
          { label: 'Failing Since', width: 80 },
        ];
        tableHeader(doc, failCols);
        data.failures.forEach((f, i) => tableRow(doc, failCols, [f.test, f.suite, f.since], i));

        doc.moveDown(0.5);
        sectionTitle(doc, 'Error Details');
        data.failures.forEach((f) => {
          doc.fillColor(RED).fontSize(8.5).font('Helvetica-Bold').text(`• ${f.test}`, 50);
          doc.fillColor(GRAY).fontSize(8).font('Helvetica').text(`  ${f.error}`, 50);
          doc.moveDown(0.4);
        });
        break;
      }

      case 'release_readiness': {
        const data = getReleaseReadinessData(filters);
        addHeader(doc, 'Release Readiness Report', `Generated ${now} · Go/No-Go Assessment`, branding);
        if (branding.showWatermark) addWatermark(doc, branding.watermark);
        addFooter(doc, branding, pageNum);

        sectionTitle(doc, 'Release Verdict');
        const verdictColor = data.grade === 'A' ? GREEN : data.grade === 'B' ? BLUE : data.grade === 'C' ? YELLOW : RED;
        summaryBox(doc, [
          { label: 'Overall Score', value: `${data.score}/100`, color: verdictColor },
          { label: 'Grade', value: data.grade, color: verdictColor },
          { label: 'Status', value: data.score >= 80 ? 'GO' : 'NO-GO', color: data.score >= 80 ? GREEN : RED },
        ]);
        doc.fillColor(GRAY).fontSize(10).font('Helvetica-BoldOblique')
          .text(`"${data.verdict}"`, { align: 'center' });
        doc.moveDown(1.5);

        sectionTitle(doc, 'Component Readiness');
        const compCols = [
          { label: 'Component', width: 160 },
          { label: 'Status', width: 90 },
          { label: 'Score', width: 80 },
          { label: 'Open Issues', width: 90 },
        ];
        tableHeader(doc, compCols);
        data.components.forEach((c, i) => tableRow(doc, compCols, [c.name, c.status, `${c.score}/100`, String(c.issues)], i));

        doc.moveDown(0.5);
        sectionTitle(doc, 'Key Metrics');
        data.metrics.forEach((m) => {
          metricRow(doc, m.label, m.value, m.ok ? GREEN : RED);
        });

        newPage();
        sectionTitle(doc, 'Risk Assessment');
        data.risks.forEach((r) => {
          const rColor = r.level === 'high' ? RED : r.level === 'medium' ? YELLOW : GRAY;
          doc.rect(50, doc.y, 6, 14).fill(rColor);
          doc.fillColor(DARK).fontSize(9).font('Helvetica')
            .text(`[${r.level.toUpperCase()}] ${r.description}`, 64, doc.y - 12);
          doc.moveDown(0.8);
        });

        doc.moveDown(0.5);
        sectionTitle(doc, 'Recommendations');
        data.recommendations.forEach((rec, i) => {
          doc.fillColor(DARK).fontSize(9).font('Helvetica')
            .text(`${i + 1}. ${rec}`, 50);
          doc.moveDown(0.5);
        });
        break;
      }
    }

    doc.end();
  });
}
