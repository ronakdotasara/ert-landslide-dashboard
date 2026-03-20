"""
Data Export Utility
Exports ERT readings to CSV, JSON, or formatted report.
"""

import json, csv, sys, os
from datetime import datetime
from typing import List, Dict


def to_csv(readings: List[Dict], filepath: str):
    if not readings:
        print("No readings to export.")
        return
    with open(filepath, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=readings[0].keys())
        writer.writeheader()
        writer.writerows(readings)
    print(f"CSV exported: {filepath} ({len(readings)} rows)")


def to_json(readings: List[Dict], filepath: str):
    with open(filepath, 'w') as f:
        json.dump(readings, f, indent=2)
    print(f"JSON exported: {filepath} ({len(readings)} records)")


def to_report(readings: List[Dict], anomalies: List[Dict], filepath: str, device_id: str = 'ERT-001'):
    import statistics
    rhos = [r['resistivity'] for r in readings]
    ts   = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    lines = [
        f"ERT Landslide Monitoring Report",
        f"Generated: {ts}",
        f"Device:    {device_id}",
        f"=" * 50,
        f"",
        f"SUMMARY",
        f"  Total measurements : {len(readings)}",
        f"  Mean resistivity   : {statistics.mean(rhos):.2f} Ω·m" if rhos else "",
        f"  Std deviation      : {statistics.stdev(rhos):.2f} Ω·m" if len(rhos) > 1 else "",
        f"  Min resistivity    : {min(rhos):.2f} Ω·m" if rhos else "",
        f"  Max resistivity    : {max(rhos):.2f} Ω·m" if rhos else "",
        f"",
        f"ANOMALIES ({len(anomalies)} detected)",
    ]

    for a in anomalies[:20]:  # top 20
        lines.append(f"  [{a['severity']}] E{a['elec_a']}-E{a['elec_b']} "
                     f"rho={a['rho']:.1f} Ω·m  {a['type']}")

    lines += ["", "END OF REPORT"]

    with open(filepath, 'w') as f:
        f.write('\n'.join(lines))
    print(f"Report written: {filepath}")


if __name__ == '__main__':
    if len(sys.argv) < 4:
        print("Usage: python export.py <readings.json> <format: csv|json|report> <output_path>")
        sys.exit(1)

    with open(sys.argv[1]) as f:
        data = json.load(f)

    readings  = data if isinstance(data, list) else data.get('readings', [])
    fmt       = sys.argv[2].lower()
    out_path  = sys.argv[3]

    if fmt == 'csv':
        to_csv(readings, out_path)
    elif fmt == 'json':
        to_json(readings, out_path)
    elif fmt == 'report':
        to_report(readings, [], out_path)
    else:
        print(f"Unknown format: {fmt}")
        sys.exit(1)
