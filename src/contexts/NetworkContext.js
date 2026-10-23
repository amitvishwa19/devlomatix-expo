import { createContext, useContext, useEffect, useState } from 'react';

let NetInfo = null;
try {
  NetInfo = require('@react-native-community/netinfo').default;
} catch (error) {
  console.warn(
    '[network] NetInfo native module unavailable. Rebuild the dev client to enable connectivity detection.',
    error?.message,
  );
}

const NetworkContext = createContext({
  isConnected: true,
  isInternetReachable: true,
  type: 'unknown',
});

export function NetworkProvider({ children }) {
  const [state, setState] = useState({
    isConnected: true,
    isInternetReachable: true,
    type: 'unknown',
  });

  useEffect(() => {
    if (!NetInfo) return undefined;

    const unsubscribe = NetInfo.addEventListener((next) => {
      setState({
        isConnected: next.isConnected !== false,
        isInternetReachable: next.isInternetReachable !== false,
        type: next.type || 'unknown',
      });
    });

    NetInfo.fetch()
      .then((next) => {
        setState({
          isConnected: next.isConnected !== false,
          isInternetReachable: next.isInternetReachable !== false,
          type: next.type || 'unknown',
        });
      })
      .catch(() => {});

    return unsubscribe;
  }, []);

  const isOnline = Boolean(state.isConnected && state.isInternetReachable);

  return (
    <NetworkContext.Provider value={{ ...state, isOnline }}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  return useContext(NetworkContext);
}
