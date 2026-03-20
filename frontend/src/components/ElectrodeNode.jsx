// ElectrodeNode.jsx
export function ElectrodeNode({ index, stats, minRho, maxRho, isSelectedA, isSelectedB, onClick }) {
  const rho = stats?.avgRho;
  const t   = rho != null ? Math.max(0, Math.min(1, (rho - minRho) / (maxRho - minRho + 1e-6))) : null;

  let bg = 'var(--color-background-secondary)';
  if (t !== null) {
    if (t < 0.33)      bg = '#2166ac';
    else if (t < 0.66) bg = '#4dac26';
    else               bg = '#d6604d';
  }

  let border = 'var(--color-border-tertiary)';
  if (isSelectedA) border = '#F4A623';
  if (isSelectedB) border = '#7F77DD';

  return (
    <div onClick={onClick} title={rho != null ? `E${index}: ${rho.toFixed(1)} Ω·m` : `E${index}: no data`}
      style={{ aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', borderRadius: 8, cursor: 'pointer', userSelect: 'none',
        background: bg, border: `2px solid ${border}`,
        transition: 'transform 0.12s', fontSize: 10, fontWeight: 500,
        color: t !== null ? '#fff' : 'var(--color-text-tertiary)' }}
      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.12)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
      {index}
    </div>
  );
}

export default ElectrodeNode;
