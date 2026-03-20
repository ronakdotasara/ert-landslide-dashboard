// Simple lightweight store using React context + useReducer
// Drop-in replacement if you prefer Zustand: npm install zustand

import { createContext, useContext, useReducer } from 'react';

const initialState = {
  readings:     [],
  liveReadings: [],
  stats:        null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_READINGS':
      return { ...state, readings: action.payload };
    case 'APPEND_LIVE':
      return { ...state, liveReadings: [...state.liveReadings.slice(-500), ...action.payload] };
    case 'SET_STATS':
      return { ...state, stats: action.payload };
    default:
      return state;
  }
}

const SensorContext = createContext(null);

export function SensorProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <SensorContext.Provider value={{ state, dispatch }}>
      {children}
    </SensorContext.Provider>
  );
}

export function useSensorStore() {
  return useContext(SensorContext);
}
