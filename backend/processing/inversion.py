"""
ERT Inversion Algorithm
Converts raw apparent resistivity measurements into a 2D subsurface model.
Uses a simplified least-squares inversion (Res2D-style).
"""

import numpy as np
import json
import sys
from typing import List, Dict, Tuple

def build_jacobian(electrodes: np.ndarray, measurements: List[Dict]) -> np.ndarray:
    """
    Build sensitivity (Jacobian) matrix for Wenner/dipole-dipole array.
    electrodes: array of electrode x-positions (m)
    measurements: list of {elec_a, elec_b, resistivity}
    Returns J matrix (n_measurements x n_cells)
    """
    n_meas  = len(measurements)
    n_cells = len(electrodes) - 1
    J = np.zeros((n_meas, n_cells))

    for i, m in enumerate(measurements):
        a = electrodes[m['elec_a']]
        b = electrodes[m['elec_b']]
        mid = (a + b) / 2.0
        depth = abs(b - a) * 0.17  # approximate investigation depth

        for j in range(n_cells):
            cell_x = (electrodes[j] + electrodes[j + 1]) / 2.0
            cell_z = depth
            dist = np.sqrt((cell_x - mid) ** 2 + cell_z ** 2)
            J[i, j] = 1.0 / (dist + 1e-6)

    # Normalize rows
    row_norms = np.linalg.norm(J, axis=1, keepdims=True)
    J = J / (row_norms + 1e-10)
    return J


def invert(measurements: List[Dict], n_electrodes: int = 32,
           spacing: float = 0.5, iterations: int = 5,
           damping: float = 0.1) -> Dict:
    """
    Run least-squares inversion.
    Returns dict with resistivity grid and metadata.
    """
    electrodes = np.arange(n_electrodes) * spacing
    n_cells    = n_electrodes - 1

    # Observed apparent resistivity vector
    d_obs = np.array([m['resistivity'] for m in measurements])
    d_obs = np.log(d_obs + 1e-6)  # work in log space

    # Initial model: uniform half-space
    m = np.ones(n_cells) * np.mean(d_obs)

    J = build_jacobian(electrodes, measurements)
    JT = J.T

    for it in range(iterations):
        d_pred = J @ m
        residual = d_obs - d_pred
        # Damped least squares: Δm = (JᵀJ + λI)⁻¹ Jᵀ r
        A = JT @ J + damping * np.eye(n_cells)
        b = JT @ residual
        try:
            dm = np.linalg.solve(A, b)
        except np.linalg.LinAlgError:
            break
        m += dm
        rms = np.sqrt(np.mean(residual ** 2))
        if rms < 0.01:
            break

    resistivity_model = np.exp(m)
    x_positions = [(electrodes[i] + electrodes[i + 1]) / 2 for i in range(n_cells)]
    depths = [abs(measurements[min(i, len(measurements) - 1)]['elec_b'] -
                  measurements[min(i, len(measurements) - 1)]['elec_a']) * spacing * 0.17
              for i in range(n_cells)]

    return {
        'n_cells':    n_cells,
        'x_positions': x_positions,
        'depths':      depths,
        'resistivity': resistivity_model.tolist(),
        'rms_error':   float(rms) if 'rms' in dir() else None,
        'iterations':  iterations,
    }


if __name__ == '__main__':
    # Usage: python inversion.py readings.json output.json
    if len(sys.argv) < 3:
        print("Usage: python inversion.py <readings.json> <output.json>")
        sys.exit(1)

    with open(sys.argv[1]) as f:
        measurements = json.load(f)

    result = invert(measurements)

    with open(sys.argv[2], 'w') as f:
        json.dump(result, f, indent=2)

    print(f"Inversion complete. {result['n_cells']} cells. RMS: {result['rms_error']:.4f}")
