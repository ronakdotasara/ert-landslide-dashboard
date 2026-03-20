// Simple lightweight store using React context + useReducer
// No JSX used — works as a plain .js file

import { createElement, createContext, useContext, useReducer } from 'react';

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
  return createElement(
    SensorContext.Provider,
    { value: { state, dispatch } },
    children
  );
}

export function useSensorStore() {
  return useContext(SensorContext);
}
