// AlertBadge.jsx
export function AlertBadge({ count = 0 }) {
  if (count === 0) return null;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      minWidth: 20, height: 20, borderRadius: 10, padding: '0 6px',
      background: '#E24B4A', color: '#fff', fontSize: 11, fontWeight: 600 }}>
      {count > 99 ? '99+' : count}
    </div>
  );
}

export default AlertBadge;
