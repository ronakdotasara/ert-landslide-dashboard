"""
Anomaly Detection for ERT Data
Identifies low-resistivity zones (moisture / potential slip surfaces)
and high-resistivity anomalies (voids, rock intrusions).
"""

import numpy as np
import json
import sys
from typing import List, Dict


def detect_anomalies(readings: List[Dict],
                     low_pct: float = 20.0,
                     high_pct: float = 80.0) -> Dict:
    """
    Flag electrode pairs whose resistivity falls below low_pct percentile
    (wet/moisture zone) or above high_pct percentile (void/rock).
    Returns list of anomaly objects with location and severity.
    """
    if not readings:
        return {'anomalies': [], 'stats': {}}

    rhos = np.array([r['resistivity'] for r in readings])
    p_low  = np.percentile(rhos, low_pct)
    p_high = np.percentile(rhos, high_pct)
    mean   = float(np.mean(rhos))
    std    = float(np.std(rhos))

    anomalies = []
    for r in readings:
        rho = r['resistivity']
        if rho < p_low:
            severity = 'HIGH' if rho < p_low * 0.5 else 'MEDIUM'
            anomalies.append({
                'elec_a':   r['elec_a'],
                'elec_b':   r['elec_b'],
                'type':     'LOW_RESISTIVITY',
                'rho':      round(rho, 3),
                'severity': severity,
                'note':     'Possible moisture / saturated zone — landslide risk',
            })
        elif rho > p_high:
            severity = 'HIGH' if rho > p_high * 2 else 'LOW'
            anomalies.append({
                'elec_a':   r['elec_a'],
                'elec_b':   r['elec_b'],
                'type':     'HIGH_RESISTIVITY',
                'rho':      round(rho, 3),
                'severity': severity,
                'note':     'Possible void or resistive rock layer',
            })

    return {
        'anomalies': anomalies,
        'stats': {
            'mean':    round(mean, 3),
            'std':     round(std, 3),
            'p_low':   round(float(p_low),  3),
            'p_high':  round(float(p_high), 3),
            'count':   len(readings),
            'flagged': len(anomalies),
        }
    }


def risk_level(anomalies: List[Dict]) -> str:
    """
    Summarize overall landslide risk based on anomaly count and severity.
    """
    high = sum(1 for a in anomalies if a['severity'] == 'HIGH' and a['type'] == 'LOW_RESISTIVITY')
    med  = sum(1 for a in anomalies if a['severity'] == 'MEDIUM')
    if high >= 3:   return 'CRITICAL'
    if high >= 1:   return 'HIGH'
    if med  >= 3:   return 'MEDIUM'
    return 'LOW'


if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python anomaly_detect.py <readings.json> <output.json>")
        sys.exit(1)

    with open(sys.argv[1]) as f:
        readings = json.load(f)

    result = detect_anomalies(readings)
    result['risk_level'] = risk_level(result['anomalies'])

    with open(sys.argv[2], 'w') as f:
        json.dump(result, f, indent=2)

    print(f"Anomalies detected: {result['stats']['flagged']} / {result['stats']['count']}")
    print(f"Risk level: {result['risk_level']}")
