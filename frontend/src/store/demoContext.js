import { createElement, createContext, useContext, useState, useMemo } from 'react';
import {
  generateAllDemoData,
  generateDemoStats,
  generateDemoAlerts,
} from '../hooks/useDemoData';

const DemoContext = createContext(null);

export function DemoProvider({ children }) {
  const [demoMode, setDemoMode] = useState(false);

  const demoData = useMemo(() => {
    if (!demoMode) return null;
    const readings = generateAllDemoData();
    return {
      readings,
      stats:  generateDemoStats(readings),
      alerts: generateDemoAlerts(readings),
    };
  }, [demoMode]);

  return createElement(
    DemoContext.Provider,
    { value: { demoMode, setDemoMode, demoData } },
    children
  );
}

export function useDemoContext() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error('useDemoContext must be used inside DemoProvider');
  return ctx;
}
