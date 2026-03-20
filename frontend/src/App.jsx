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
import './App.css';

const NAV_ITEMS = [
  { id: 'dashboard',  label: 'Dashboard',       icon: '⬛' },
  { id: 'map',        label: 'Resistivity Map',  icon: '▦'  },
  { id: 'electrodes', label: 'Electrode Grid',   icon: '⊞'  },
  { id: 'control',    label: 'Manual Control',   icon: '⊙'  },
  { id: 'alerts',     label: 'Alerts',           icon: '⚑'  },
  { id: 'export',     label: 'Data Export',      icon: '↓'  },
  { id: 'settings',   label: 'Settings',         icon: '⚙'  },
];

function AppInner() {
  const [page, setPage]         = useState('dashboard');
  const [navOpen, setNavOpen]   = useState(true);
  const { unreadCount }         = useAlertStore();

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
      {/* Sidebar */}
      <aside className={`sidebar ${navOpen ? 'open' : 'collapsed'}`}>
        <div className="sidebar-brand">
          <span className="brand-icon">⟁</span>
          {navOpen && <span className="brand-text">ERT Monitor</span>}
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

      {/* Main content */}
      <main className="main-content">
        {PAGE_MAP[page]}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <SensorProvider>
      <AlertProvider>
        <AppInner />
      </AlertProvider>
    </SensorProvider>
  );
}
