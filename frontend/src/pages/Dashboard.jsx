import { useEffect, useState } from 'react';
import StatusBar        from '../components/StatusBar';
import LiveChart        from '../components/LiveChart';
import HeatmapGrid      from '../components/HeatmapGrid';
import ScanControl      from '../components/ScanControl';
import AlertBadge       from '../components/AlertBadge';
import ResistivityTable from '../components/ResistivityTable';
import { useSensorData }  from '../hooks/useSensorData';
import { useWebSocket }   from '../hooks/useWebSocket';
import { useAlertStore }  from '../store/alertStore';
import { useDemoContext } from '../store/demoContext';

export default function Dashboard() {
  const { readings, stats, loading, refresh } = useSensorData();
  const { connected, lastMessage }            = useWebSocket();
  const { alerts, unreadCount }               = useAlertStore();
  const { demoMode, setDemoMode, demoData }   = useDemoContext();
  const [liveReadings, setLiveReadings]       = useState([]);
  const [deviceStatus, setDeviceStatus]       = useState(null);

  useEffect(() => {
    if (!lastMessage) return;
    if (lastMessage.type === 'READING') {
      setLiveReadings(prev => [...prev.slice(-200), lastMessage]);
    } else if (lastMessage.type === 'SCAN_COMPLETE') {
      setLiveReadings(prev => [...prev.slice(-200), ...(lastMessage.readings || [])]);
      refresh();
    } else if (lastMessage.type === 'SCAN_UPDATE') {
      setLiveReadings(prev => [...prev.slice(-200), ...(lastMessage.readings || [])]);
      refresh();
    } else if (lastMessage.type === 'STATUS') {
      setDeviceStatus(lastMessage);
    }
  }, [lastMessage]);

  // ── Resolve what to actually display ──────────────────────────────────
  // Demo mode takes full priority; otherwise fall back to live → fetched data
  const activeReadings = demoMode
    ? demoData?.readings ?? []
    : liveReadings.length > 0 ? liveReadings : readings;

  const activeStats = demoMode ? demoData?.stats ?? null : stats;

  // ── "Waiting for data" state ───────────────────────────────────────────
  const hasData    = activeReadings.length > 0;
  const isWaiting  = !demoMode && !loading && !connected && !hasData;

  return (
    <div className="dashboard-layout">
      <StatusBar
        connected={demoMode ? true : connected}
        stats={activeStats}
        deviceStatus={deviceStatus}
        demoMode={demoMode}
      />

      {/* Demo mode toggle banner */}
      {!connected && !demoMode && (
        <div className="demo-banner">
          <span>No device connected.</span>
          <button className="btn-demo" onClick={() => setDemoMode(true)}>
            Try Demo Mode
          </button>
        </div>
      )}
      {demoMode && (
        <div className="demo-banner demo-banner--active">
          <span>🟡 Demo mode — synthetic ERT data</span>
          <button className="btn-demo btn-demo--exit" onClick={() => setDemoMode(false)}>
            Exit Demo
          </button>
        </div>
      )}

      {/* Waiting overlay */}
      {isWaiting && (
        <div className="waiting-overlay">
          <div className="waiting-box">
            <div className="waiting-spinner" />
            <p>Waiting for device data…</p>
            <small>Connect your ERT device or try Demo Mode above.</small>
          </div>
        </div>
      )}

      <div className="dashboard-grid">
        <section className="card chart-card">
          <div className="card-header">
            <h2>Live Resistivity</h2>
            <AlertBadge count={unreadCount} />
          </div>
          <LiveChart readings={activeReadings} />
        </section>

        <section className="card control-card">
          <h2>Scan Control</h2>
          <ScanControl disabled={demoMode} />
        </section>

        <section className="card heatmap-card">
          <h2>Resistivity Heatmap</h2>
          <HeatmapGrid readings={activeReadings} />
        </section>

        <section className="card table-card">
          <div className="card-header">
            <h2>Latest Readings</h2>
            {loading && !demoMode && <span className="loading-pill">Loading…</span>}
          </div>
          <ResistivityTable readings={activeReadings.slice(0, 50)} />
        </section>
      </div>
    </div>
  );
}