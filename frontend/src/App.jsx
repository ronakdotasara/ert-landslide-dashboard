import { useState } from 'react';
import Dashboard      from './pages/Dashboard';
import ResistivityMap from './pages/ResistivityMap';
import ElectrodeGrid  from './pages/ElectrodeGrid';
import ManualControl  from './pages/ManualControl';
import AlertsLog      from './pages/AlertsLog';
import DataExport     from './pages/DataExport';
import Settings       from './pages/Settings';
import { SensorProvider } from './store/sensorStore';
import { AlertProvider, useAlertStore } from './store/alertStore';
import { DemoProvider, useDemoContext } from './store/demoContext';
import './App.css';

const NAV_ITEMS = [
  { id: 'dashboard',  label: 'Dashboard',      icon: '⬛' },
  { id: 'map',        label: 'Resistivity Map', icon: '▦'  },
  { id: 'electrodes', label: 'Electrode Grid',  icon: '⊞'  },
  { id: 'control',    label: 'Manual Control',  icon: '⊙'  },
  { id: 'alerts',     label: 'Alerts',          icon: '⚑'  },
  { id: 'export',     label: 'Data Export',     icon: '↓'  },
  { id: 'settings',   label: 'Settings',        icon: '⚙'  },
];

function DemoToggle() {
  const { demoMode, setDemoMode } = useDemoContext();
  return (
    <button
      onClick={() => setDemoMode(v => !v)}
      title={demoMode ? 'Exit demo mode' : 'Preview with simulated data'}
      style={{
        position: 'fixed', bottom: 20, right: 20, zIndex: 1000,
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '8px 14px', borderRadius: 20,
        background: demoMode ? '#7F77DD' : 'var(--color-background-secondary)',
        color: demoMode ? '#fff' : 'var(--color-text-secondary)',
        border: demoMode ? '1.5px solid #534AB7' : '1.5px solid var(--color-border-secondary)',
        fontSize: 12, fontWeight: 500, cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
        transition: 'all 0.18s ease',
      }}
    >
      <span style={{ fontSize: 14 }}>{demoMode ? '◉' : '○'}</span>
      {demoMode ? 'Demo mode ON' : 'Demo mode'}
    </button>
  );
}

function AppInner() {
  const [page, setPage]       = useState('dashboard');
  const [navOpen, setNavOpen] = useState(true);
  const { unreadCount }       = useAlertStore();
  const { demoMode }          = useDemoContext();

  const PAGE_MAP = {
    dashboard:  <Dashboard />,
    map:        <ResistivityMap />,
    electrodes: <ElectrodeGrid />,
    control:    <ManualControl />,
    alerts:     <AlertsLog />,
    export:     <DataExport />,
    settings:   <Settings />,
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${navOpen ? 'open' : 'collapsed'}`}>
        <div className="sidebar-brand">
          <span className="brand-icon">⟁</span>
          {navOpen && (
            <span className="brand-text">
              ERT Monitor
              {demoMode && (
                <span style={{ marginLeft: 6, fontSize: 9, background: '#7F77DD',
                  color: '#fff', padding: '1px 5px', borderRadius: 6, fontWeight: 600,
                  verticalAlign: 'middle', letterSpacing: 0.3 }}>
                  DEMO
                </span>
              )}
            </span>
          )}
        </div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`nav-item ${page === item.id ? 'active' : ''}`}
              onClick={() => setPage(item.id)}
              title={item.label}
            >
              <span className="nav-icon">{item.icon}</span>
              {navOpen && (
                <span className="nav-label">
                  {item.label}
                  {item.id === 'alerts' && unreadCount > 0 && (
                    <span className="nav-badge">{unreadCount}</span>
                  )}
                </span>
              )}
            </button>
          ))}
        </nav>
        <button className="collapse-btn" onClick={() => setNavOpen(v => !v)}>
          {navOpen ? '◀' : '▶'}
        </button>
      </aside>

      <main className="main-content">
        {PAGE_MAP[page]}
      </main>

      <DemoToggle />
    </div>
  );
}

export default function App() {
  return (
    <DemoProvider>
      <SensorProvider>
        <AlertProvider>
          <AppInner />
        </AlertProvider>
      </SensorProvider>
    </DemoProvider>
  );
}
