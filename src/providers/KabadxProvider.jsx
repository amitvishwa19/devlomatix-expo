import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as pickupsService from '~/services/kabadx/pickups';
import * as ratesService from '~/services/kabadx/rates';
import * as collectorsService from '~/services/kabadx/collectors';
import * as analyticsService from '~/services/kabadx/analytics';

const KabadxContext = createContext(null);

export function KabadxProvider({ children }) {
  const [pickups, setPickups] = useState([]);
  const [rates, setRates] = useState([]);
  const [collectors, setCollectors] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      const [pData, rData, cData, aData] = await Promise.all([
        pickupsService.getPickups(),
        ratesService.getScrapRates(),
        collectorsService.getCollectors(),
        analyticsService.getKabadxAnalytics(),
      ]);
      setPickups(pData);
      setRates(rData);
      setCollectors(cData);
      setAnalytics(aData);
    } catch (err) {
      console.error('Error refreshing KabadX data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const addPickup = useCallback((newPickup) => {
    const pickupObj = {
      id: `pk-${Date.now()}`,
      status: 'PENDING',
      collectorId: null,
      collectorName: null,
      actualWeight: null,
      finalPayout: null,
      createdAt: new Date().toISOString(),
      ...newPickup,
    };
    setPickups((prev) => [pickupObj, ...prev]);
    return pickupObj;
  }, []);

  const assignCollector = useCallback((pickupId, collectorId) => {
    const collector = collectors.find((c) => c.id === collectorId);
    setPickups((prev) =>
      prev.map((p) =>
        p.id === pickupId
          ? { ...p, status: 'ASSIGNED', collectorId, collectorName: collector ? collector.name : 'Assigned Collector' }
          : p
      )
    );
  }, [collectors]);

  const updatePickupStatus = useCallback((pickupId, status, actualWeight = null, finalPayout = null) => {
    setPickups((prev) =>
      prev.map((p) =>
        p.id === pickupId
          ? {
              ...p,
              status,
              ...(actualWeight !== null && { actualWeight: Number(actualWeight) }),
              ...(finalPayout !== null && { finalPayout: Number(finalPayout) }),
            }
          : p
      )
    );
  }, []);

  const addCollector = useCallback((collectorData) => {
    const newCol = {
      id: `col-${Date.now()}`,
      rating: 5.0,
      active: true,
      completedPickups: 0,
      todayPickups: 0,
      avatarColor: '#0d9488',
      ...collectorData,
    };
    setCollectors((prev) => [newCol, ...prev]);
    return newCol;
  }, []);

  const toggleCollectorActive = useCallback((collectorId) => {
    setCollectors((prev) =>
      prev.map((c) => (c.id === collectorId ? { ...c, active: !c.active } : c))
    );
  }, []);

  const value = {
    pickups,
    rates,
    collectors,
    analytics,
    loading,
    refreshData,
    addPickup,
    assignCollector,
    updatePickupStatus,
    addCollector,
    toggleCollectorActive,
  };

  return <KabadxContext.Provider value={value}>{children}</KabadxContext.Provider>;
}

export function useKabadx() {
  const ctx = useContext(KabadxContext);
  if (!ctx) {
    throw new Error('useKabadx must be used within KabadxProvider');
  }
  return ctx;
}
