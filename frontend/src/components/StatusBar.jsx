export default function StatusBar({ connected, stats }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
      padding: '10px 20px', background: 'var(--color-background-secondary)',
      borderBottom: '1px solid var(--color-border-tertiary)', fontSize: 12 }}>

      {/* WS connection */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%',
          background: connected ? '#1D9E75' : '#E24B4A' }} />
        <span style={{ color: 'var(--color-text-secondary)' }}>
          {connected ? 'Live' : 'Disconnected'}
        </span>
      </div>

      {stats && (
        <>
          <StatItem label="Total readings" value={stats.total_readings?.toLocaleString()} />
          <StatItem label="Avg ρ" value={stats.avg_rho ? `${Number(stats.avg_rho).toFixed(1)} Ω·m` : '—'} />
          <StatItem label="Min ρ" value={stats.min_rho ? `${Number(stats.min_rho).toFixed(1)} Ω·m` : '—'} />
          <StatItem label="Max ρ" value={stats.max_rho ? `${Number(stats.max_rho).toFixed(1)} Ω·m` : '—'} />
          {stats.last_ts && (
            <StatItem label="Last scan"
              value={new Date(stats.last_ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} />
          )}
        </>
      )}

      <div style={{ marginLeft: 'auto', color: 'var(--color-text-tertiary)' }}>
        Device: ERT-001
      </div>
    </div>
  );
}

function StatItem({ label, value }) {
  return (
    <div>
      <span style={{ color: 'var(--color-text-tertiary)' }}>{label}: </span>
      <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{value ?? '—'}</span>
    </div>
  );
}
