import { useState, useEffect } from "react";
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '';

const apiClient = axios.create({
  baseURL: API_URL.replace(/\/$/, ''),
  timeout: 60000
});

function isValidTestUrl(value) {
  const trimmed = (value || "").trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | running | passed | failed

  // Scheduler state
  const [schedulerStatus, setSchedulerStatus] = useState({ running: false, frequency: 'disabled' });
  const [currentFrequency, setCurrentFrequency] = useState('5min');
  const [schedulerLoading, setSchedulerLoading] = useState(false);

  const [errorText, setErrorText] = useState("");
  const [logs, setLogs] = useState([]);
  const [errors, setErrors] = useState([]);
  const [summary, setSummary] = useState("");
  const [performance, setPerformance] = useState({});
  const [screenshotBase64, setScreenshotBase64] = useState(null);
  const [testedSite, setTestedSite] = useState('');
  const [lighthouseScores, setLighthouseScores] = useState({});
  const [visual, setVisual] = useState(null);
  const [classifiedErrors, setClassifiedErrors] = useState([]);
  const [errorStats, setErrorStats] = useState({});
  const [warnings, setWarnings] = useState([]);

  const runTest = async () => {
    setErrorText("");
    setStatus("running");
    setLogs([]);
    setErrors([]);
    setSummary("");
    setPerformance({});
    setScreenshotBase64(null);

    const trimmedUrl = url.trim();
    setTestedSite(extractSiteName(trimmedUrl));

    try {
      setLoading(true);
      const { data } = await apiClient.post('/api/test', { url: trimmedUrl });

      const ok = Boolean(data?.success);
      const nextStatus = ok ? "passed" : "failed";
      setStatus(nextStatus);

      setLogs(Array.isArray(data?.logs) ? data.logs : []);
      setErrors(Array.isArray(data?.errors) ? data.errors : []);
      setWarnings(Array.isArray(data?.warnings) ? data.warnings : []);
      setSummary(data?.summary || "");
      setPerformance(data?.performance || {});
      setLighthouseScores(data?.lighthouse || {});
      setVisual(data?.visual || data?.data?.visual || null);
      setClassifiedErrors(data?.classifiedErrors || []);
      setErrorStats(data?.errorStats || {});
      
      const base64 = data?.data?.screenshotBase64;
      if (typeof base64 === "string" && base64.length > 0) {
        setScreenshotBase64(base64);
      }

      if (!ok) {
        setErrorText(
          (Array.isArray(data?.errors) ? data.errors[0] : null) ||
            data?.message ||
            'Test completed with issues'
        );
      }
    } catch (err) {
      setStatus("failed");
      setErrorText(err.response?.data?.error || 'Could not reach backend');
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedulerStatus = async () => {
    try {
      const { data } = await apiClient.get('/scheduler/status');
      setSchedulerStatus(data);
      if (data.frequency !== 'disabled' && data.frequency !== currentFrequency) {
        setCurrentFrequency(data.frequency);
      }
    } catch (err) {
      console.error('Scheduler status fetch failed:', err);
    }
  };

  const startScheduler = async () => {
    try {
      setSchedulerLoading(true);
      await apiClient.post('/scheduler/start', { frequency: currentFrequency });
      fetchSchedulerStatus();
    } catch (err) {
      alert('Failed to start scheduler: ' + (err.response?.data?.error || err.message));
    } finally {
      setSchedulerLoading(false);
    }
  };

  const stopScheduler = async () => {
    try {
      setSchedulerLoading(true);
      await apiClient.post('/scheduler/stop');
      fetchSchedulerStatus();
    } catch (err) {
      alert('Failed to stop scheduler: ' + (err.response?.data?.error || err.message));
    } finally {
      setSchedulerLoading(false);
    }
  };

  const setFrequency = async (freq) => {
    setCurrentFrequency(freq);
    try {
      await apiClient.post('/scheduler/set-frequency', { frequency: freq });
    } catch (err) {
      alert('Failed to set frequency');
    }
  };

  const downloadPDF = async () => {
    try {
      const siteParam = encodeURIComponent(testedSite);
      const url = `/report/pdf?site=${siteParam}`;
      const link = document.createElement('a');
      link.href = apiClient.defaults.baseURL + url;
      link.download = `qa360-report-${testedSite}.pdf`;
      link.click();
    } catch (err) {
      alert('Failed to download PDF');
    }
  };

  function extractSiteName(fullUrl) {
    try {
      const urlObj = new URL(fullUrl);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return fullUrl.slice(0, 20) + (fullUrl.length > 20 ? '...' : '');
    }
  }

  useEffect(() => {
    fetchSchedulerStatus();
    const interval = setInterval(fetchSchedulerStatus, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  const statusLabel =
    status === "idle"
      ? "Idle"
      : status === "running"
        ? "Running"
        : status === "passed"
          ? "Passed"
          : "Failed";

  return (
    <div
      style={{
        textAlign: "center",
        marginTop: "48px",
        fontFamily: "system-ui, Arial",
        maxWidth: "760px",
        marginLeft: "auto",
        marginRight: "auto",
        padding: "0 16px",
      }}
    >
      <h1 style={{ marginBottom: 8 }}>QA360 Website Testing Tool</h1>
      
      {/* Scheduler Control Panel */}
      <div style={{
        background: schedulerStatus.running ? '#d4edda' : '#f8d7da',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: 24,
        border: `3px solid ${schedulerStatus.running ? '#28a745' : '#dc3545'}`
      }}>
        <h3 style={{ marginTop: 0 }}>📅 Scheduler Control</h3>
        <p><strong>Status:</strong> {schedulerStatus.running ? '🟢 Running' : '🔴 Stopped'} ({schedulerStatus.frequency})</p>
        
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
          <select 
            value={currentFrequency} 
            onChange={(e) => setFrequency(e.target.value)}
            disabled={schedulerLoading}
            style={{ padding: '8px 12px' }}
          >
            <option value="5min">Every 5 minutes</option>
            <option value="15min">Every 15 minutes</option>
            <option value="hourly">Hourly</option>
            <option value="daily">Daily</option>
          </select>
          
          <button 
            onClick={startScheduler} 
            disabled={schedulerStatus.running || schedulerLoading}
            style={{ 
              padding: '10px 20px', 
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: schedulerStatus.running ? 'not-allowed' : 'pointer'
            }}
          >
            {schedulerLoading ? 'Starting...' : 'Start Scheduler'}
          </button>
          
          <button 
            onClick={stopScheduler} 
            disabled={!schedulerStatus.running || schedulerLoading}
            style={{ 
              padding: '10px 20px', 
              background: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: !schedulerStatus.running ? 'not-allowed' : 'pointer'
            }}
          >
            {schedulerLoading ? 'Stopping...' : 'Stop Scheduler'}
          </button>
        </div>
      </div>

      <p style={{ marginTop: 0, marginBottom: 24 }}>Enter any website URL to test</p>

      <input
        type="text"
        placeholder="https://example.com"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        style={{ padding: "10px", width: "100%" }}
        disabled={loading}
      />

      <div style={{ marginTop: 16 }}>
        <button onClick={runTest} disabled={loading} style={{ padding: "10px 16px" }}>
          {loading ? "Running..." : "Run Test"}
        </button>
      </div>

      <div style={{ marginTop: 18 }}>
        <p style={{ margin: 0 }}>
          <strong>Status:</strong> {statusLabel}
        </p>
      </div>

      {errorText && (
        <p style={{ color: "red", marginTop: "14px" }}>{errorText}</p>
      )}

      {!!(logs.length > 0 || errors.length > 0 || summary || screenshotBase64 || Object.keys(lighthouseScores).length || visual || classifiedErrors.length) && (
        <div
          style={{
            marginTop: 20,
            textAlign: "left",
            background: "#f5f5f5",
            padding: "15px",
            borderRadius: "8px",
          }}
        >
{summary && (
            <p style={{ marginTop: 0, marginBottom: 12 }}>
              <strong>Summary:</strong> {summary}
            </p>
          )}

          {/* Lighthouse Scores */}
          {Object.keys(lighthouseScores).length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ margin: '0 0 12px 0' }}>🏮 Lighthouse Scores</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                {Object.entries(lighthouseScores).map(([category, score]) => (
                  <div key={category} style={{ textAlign: 'center' }}>
                    <strong>{category.replace('-', ' ').toUpperCase()}</strong>
                    <div style={{ background: '#e0e0e0', height: 20, margin: '8px 0', borderRadius: 10, overflow: 'hidden' }}>
                      <div style={{ 
                        background: `linear-gradient(90deg, #4caf50 ${score}%, #ddd ${score}%)`, 
                        height: '100%', 
                        transition: 'width 0.3s ease' 
                      }} />
                    </div>
                    <span style={{ fontSize: 24, fontWeight: 'bold' }}>{score}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Visual Regression */}
          {visual && (
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ margin: '0 0 12px 0' }}>👁️ Visual Regression</h4>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                <div style={{ maxWidth: 300 }}>
                  <strong>Baseline</strong>
                  <img src={`data:image/png;base64,${visual.baselineBase64}`} style={{ width: '100%', maxHeight: 200, objectFit: 'contain' }} />
                </div>
                <div style={{ maxWidth: 300 }}>
                  <strong>Current</strong>
                  <img src={`data:image/png;base64,${visual.currentBase64}`} style={{ width: '100%', maxHeight: 200, objectFit: 'contain' }} />
                </div>
                {visual.diffBase64 && (
                  <div style={{ maxWidth: 300 }}>
                    <strong>Diff ({visual.diffPercent.toFixed(2)}% {visual.changed ? 'CHANGED' : 'OK'})</strong>
                    <img src={`data:image/png;base64,${visual.diffBase64}`} style={{ width: '100%', maxHeight: 200, objectFit: 'contain' }} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error Statistics */}
          {Object.keys(errorStats).some(k => errorStats[k] > 0) && (
            <div style={{ marginBottom: 16 }}>
              <h4 style={{ margin: '0 0 12px 0' }}>⚠️ Error Stats</h4>
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ color: 'red', fontSize: 24, fontWeight: 'bold' }}>{errorStats.critical || 0}</span>
                  <br /><small>Critical</small>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ color: 'orange', fontSize: 24, fontWeight: 'bold' }}>{errorStats.warning || 0}</span>
                  <br /><small>Warnings</small>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ color: 'green', fontSize: 24, fontWeight: 'bold' }}>{errorStats.ignore || 0}</span>
                  <br /><small>Ignored</small>
                </div>
              </div>
            </div>
          )}

          {/* Classified Errors by Type */}
          {classifiedErrors.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <h4 style={{ margin: '0 0 8px 0' }}>Classified Errors</h4>
              {['critical', 'warning', 'ignore'].map(type => {
                const typeErrors = classifiedErrors.filter(e => e.type === type);
                if (typeErrors.length === 0) return null;
                const color = type === 'critical' ? '#ff4444' : type === 'warning' ? '#ffaa00' : '#44ff44';
                return (
                  <div key={type} style={{ marginBottom: 12 }}>
                    <strong style={{ color }}>{type.toUpperCase()} ({typeErrors.length})</strong>
                    <pre style={{ 
                      background: type === 'critical' ? '#300' : type === 'warning' ? '#330' : '#030', 
                      color, 
                      padding: "10px", 
                      marginTop: 4,
                      overflowX: "auto", 
                      maxHeight: "160px", 
                      whiteSpace: "pre-wrap" 
                    }}>
                      {typeErrors.map((e, i) => `${i+1}. ${e.message}`).join('\n')}
                    </pre>
                  </div>
                );
              })}
            </div>
          )}

          {performance && performance.totalMs !== undefined && (
            <p style={{ marginTop: 0, marginBottom: 12 }}>
              <strong>Performance:</strong>{" "}
              {typeof performance.totalMs === "number"
                ? `${performance.totalMs}ms total`
                : "—"}
            </p>
          )}

          {screenshotBase64 && (
            <div style={{ marginBottom: 12 }}>
              <p style={{ margin: "0 0 8px 0", display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'space-between' }}>
                <strong>Screenshot:</strong>
                {testedSite && (
                  <button 
                    onClick={downloadPDF}
                    style={{
                      padding: '6px 12px',
                      background: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: 4,
                      fontSize: 14,
                      cursor: 'pointer'
                    }}
                  >
                    📄 Download PDF Report
                  </button>
                )}
              </p>
              <img
                src={`data:image/png;base64,${screenshotBase64}`}
                alt="Test screenshot"
                style={{ width: "100%", maxHeight: 420, objectFit: "contain", background: "#fff" }}
              />
            </div>
          )}

          {errors.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <p style={{ margin: "0 0 8px 0" }}>
                <strong>Errors:</strong>
              </p>
              <pre
                style={{
                  background: "#120000",
                  color: "#ff6b6b",
                  padding: "10px",
                  overflowX: "auto",
                  maxHeight: "240px",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {errors.join("\n")}
              </pre>
            </div>
          )}

          {logs.length > 0 && (
            <div>
              <p style={{ margin: "0 0 8px 0" }}>
                <strong>Logs:</strong>
              </p>
              <pre
                style={{
                  background: "#000",
                  color: "#0f0",
                  padding: "10px",
                  overflowX: "auto",
                  maxHeight: "240px",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {logs.join("\n")}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;