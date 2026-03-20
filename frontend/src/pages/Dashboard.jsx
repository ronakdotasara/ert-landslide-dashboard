import { useEffect, useState } from 'react';
import StatusBar from '../components/StatusBar';
import LiveChart from '../components/LiveChart';
import HeatmapGrid from '../components/HeatmapGrid';
import ScanControl from '../components/ScanControl';
import AlertBadge from '../components/AlertBadge';
import ResistivityTable from '../components/ResistivityTable';
import { useSensorData } from '../hooks/useSensorData';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAlertStore } from '../store/alertStore';

export default function Dashboard() {
  const { readings, stats, loading, refresh } = useSensorData();
  const { connected, lastMessage }            = useWebSocket();
  const { alerts, unreadCount }               = useAlertStore();
  const [liveReadings, setLiveReadings]        = useState([]);

  useEffect(() => {
    if (lastMessage?.type === 'SCAN_UPDATE') {
      setLiveReadings(prev => [...prev.slice(-200), ...lastMessage.readings]);
      refresh();
    }
  }, [lastMessage]);

  return (
    <div className="dashboard-layout">
      <StatusBar connected={connected} stats={stats} />

      <div className="dashboard-grid">
        {/* Top row: live chart + alert summary */}
        <section className="card chart-card">
          <div className="card-header">
            <h2>Live Resistivity</h2>
            <AlertBadge count={unreadCount} />
          </div>
          <LiveChart readings={liveReadings.length > 0 ? liveReadings : readings} />
        </section>

        <section className="card control-card">
          <h2>Scan Control</h2>
          <ScanControl />
        </section>

        {/* Middle: heatmap */}
        <section className="card heatmap-card">
          <h2>Resistivity Heatmap</h2>
          <HeatmapGrid readings={readings} />
        </section>

        {/* Bottom: data table */}
        <section className="card table-card">
          <div className="card-header">
            <h2>Latest Readings</h2>
            {loading && <span className="loading-pill">Loading…</span>}
          </div>
          <ResistivityTable readings={readings.slice(0, 50)} />
        </section>
      </div>
    </div>
  );
}
