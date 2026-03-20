import { createContext, useCallback, useContext, useReducer } from 'react';

const initialState = {
  alerts:      [],
  unreadCount: 0,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_ALERTS': {
      const unread = action.payload.filter(a => !a.read).length;
      return { ...state, alerts: action.payload, unreadCount: unread };
    }
    case 'MARK_READ': {
      const alerts = state.alerts.map(a => a.id === action.id ? { ...a, read: 1 } : a);
      return { ...state, alerts, unreadCount: alerts.filter(a => !a.read).length };
    }
    case 'MARK_ALL_READ': {
      const alerts = state.alerts.map(a => ({ ...a, read: 1 }));
      return { ...state, alerts, unreadCount: 0 };
    }
    case 'APPEND_ALERT': {
      const alerts = [action.payload, ...state.alerts];
      return { ...state, alerts, unreadCount: state.unreadCount + 1 };
    }
    default:
      return state;
  }
}

const AlertContext = createContext(null);

export function AlertProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const fetchAlerts = useCallback(async () => {
    try {
      const res  = await fetch('/api/alerts?device=ERT-001&limit=100');
      const data = await res.json();
      dispatch({ type: 'SET_ALERTS', payload: data.alerts || [] });
    } catch (e) {
      console.error('[AlertStore] fetch error:', e);
    }
  }, []);

  const markRead = useCallback(async (id) => {
    dispatch({ type: 'MARK_READ', id });
    await fetch(`/api/alerts/${id}/read`, { method: 'POST' });
  }, []);

  const markAllRead = useCallback(() => {
    dispatch({ type: 'MARK_ALL_READ' });
    state.alerts.filter(a => !a.read).forEach(a =>
      fetch(`/api/alerts/${a.id}/read`, { method: 'POST' })
    );
  }, [state.alerts]);

  return (
    <AlertContext.Provider value={{
      alerts:      state.alerts,
      unreadCount: state.unreadCount,
      fetchAlerts,
      markRead,
      markAllRead,
    }}>
      {children}
    </AlertContext.Provider>
  );
}

export function useAlertStore() {
  return useContext(AlertContext);
}
