"""
Grid Builder
Converts raw electrode pair readings into a structured 2D/3D resistivity grid
suitable for heatmap rendering on the dashboard.
"""

import numpy as np
import json
import sys
from typing import List, Dict

def build_2d_grid(readings: List[Dict], n_electrodes: int = 32,
                  spacing: float = 0.5) -> Dict:
    """
    Build a 2D pseudo-section grid from raw measurements.
    X-axis = midpoint position, Y-axis = investigation depth.
    """
    grid_points = []

    for r in readings:
        a = r['elec_a']
        b = r['elec_b']
        rho = r['resistivity']

        x_mid = (a + b) / 2.0 * spacing
        depth = abs(b - a) * spacing * 0.17  # standard depth factor

        grid_points.append({
            'x':  round(x_mid, 3),
            'z':  round(depth, 3),
            'rho': round(rho, 4),
        })

    if not grid_points:
        return {'grid': [], 'x_range': [0, 0], 'z_range': [0, 0], 'rho_range': [0, 0]}

    xs   = [p['x']   for p in grid_points]
    zs   = [p['z']   for p in grid_points]
    rhos = [p['rho'] for p in grid_points]

    return {
        'grid':      grid_points,
        'x_range':   [min(xs),   max(xs)],
        'z_range':   [min(zs),   max(zs)],
        'rho_range': [min(rhos), max(rhos)],
        'n_points':  len(grid_points),
    }


def build_3d_grid(scans: List[List[Dict]], y_positions: List[float],
                  n_electrodes: int = 32, spacing: float = 0.5) -> Dict:
    """
    Build a 3D resistivity volume from multiple 2D scan profiles.
    scans: list of reading arrays, one per Y position (profile line).
    y_positions: real-world Y coordinates (m) for each scan.
    """
    volume = []
    for scan, y in zip(scans, y_positions):
        grid_2d = build_2d_grid(scan, n_electrodes, spacing)
        for pt in grid_2d['grid']:
            volume.append({**pt, 'y': round(y, 3)})

    rhos = [p['rho'] for p in volume] if volume else [0]
    return {
        'volume':    volume,
        'rho_range': [min(rhos), max(rhos)],
        'n_points':  len(volume),
    }


if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python grid_builder.py <readings.json> <output.json>")
        sys.exit(1)

    with open(sys.argv[1]) as f:
        readings = json.load(f)

    result = build_2d_grid(readings)

    with open(sys.argv[2], 'w') as f:
        json.dump(result, f, indent=2)

    print(f"Grid built: {result['n_points']} points")
