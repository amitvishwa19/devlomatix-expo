import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import Toast from 'react-native-toast-message';
import { resolveWorkspaceId } from '~/utils/workspace';
import * as crmService from '~/services/crm';
import { useNetwork } from '~/contexts/NetworkContext';
import { readCache, writeCache } from '~/utils/cache';
import { enqueueMutation, flushSyncQueue } from '~/utils/syncQueue';
import { isOfflineError } from '~/utils/network';

let HapticsModule = null;
try {
  HapticsModule = require('expo-haptics');
} catch (_) {}

export const CrmContext = createContext(null);

export function CrmProvider({ children, workspaceId: propWorkspaceId }) {
  const { isOnline } = useNetwork();
  const [workspaceId, setWorkspaceId] = useState(propWorkspaceId || null);
  const [pipelines, setPipelines] = useState([]);
  const [activePipeline, setActivePipeline] = useState(null);
  const [deals, setDeals] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Quick modals state
  const [quickWhatsAppTarget, setQuickWhatsAppTarget] = useState(null); // { contact, deal, message }
  const [createDealVisible, setCreateDealVisible] = useState(false);
  const [createDealDefaultStageId, setCreateDealDefaultStageId] = useState(null);
  const [createContactVisible, setCreateContactVisible] = useState(false);
  const [createTaskVisible, setCreateTaskVisible] = useState(false);
  const [createTaskDefaults, setCreateTaskDefaults] = useState({});

  // Initialize Workspace ID
  useEffect(() => {
    async function initWs() {
      try {
        const wsId = await resolveWorkspaceId(propWorkspaceId);
        setWorkspaceId(wsId);
      } catch (err) {
        console.error('Failed to resolve workspaceId in CrmProvider:', err);
      }
    }
    initWs();
  }, [propWorkspaceId]);

  const saveCache = useCallback(
    (name, data, wsId = workspaceId) => {
      if (wsId) writeCache(`crm:${wsId}:${name}`, data);
    },
    [workspaceId]
  );

  // Load Pipelines
  const loadPipelines = useCallback(async (wsId = workspaceId) => {
    if (!wsId) return;
    try {
      const res = await crmService.getPipelines({ workspaceId: wsId });
      const pipeList = res.data || [];
      setPipelines(pipeList);
      saveCache('pipelines', pipeList, wsId);
      if (pipeList.length > 0) {
        setActivePipeline((prev) => {
          if (!prev) return pipeList[0];
          const found = pipeList.find((p) => p.id === prev.id);
          return found || pipeList[0];
        });
      }
    } catch (e) {
      console.warn('Failed to load pipelines:', e.message);
    }
  }, [workspaceId]);

  // Load Deals
  const loadDeals = useCallback(async (wsId = workspaceId, pipeId = activePipeline?.id) => {
    if (!wsId) return;
    try {
      const params = { workspaceId: wsId };
      if (pipeId && pipeId !== 'ALL') params.pipelineId = pipeId;
      const res = await crmService.getDeals(params);
      const list = res.data || [];
      setDeals(list);
      saveCache('deals', list, wsId);
    } catch (e) {
      console.warn('Failed to load deals:', e.message);
    }
  }, [workspaceId, activePipeline?.id, saveCache]);

  // Load Contacts
  const loadContacts = useCallback(async (wsId = workspaceId) => {
    if (!wsId) return;
    try {
      const res = await crmService.getContacts({ workspaceId: wsId });
      const list = res.data || [];
      setContacts(list);
      saveCache('contacts', list, wsId);
    } catch (e) {
      console.warn('Failed to load contacts:', e.message);
    }
  }, [workspaceId, saveCache]);

  // Load Accounts
  const loadAccounts = useCallback(async (wsId = workspaceId) => {
    if (!wsId) return;
    try {
      const res = await crmService.getAccounts({ workspaceId: wsId });
      const list = res.data || [];
      setAccounts(list);
      saveCache('accounts', list, wsId);
    } catch (e) {
      console.warn('Failed to load accounts:', e.message);
    }
  }, [workspaceId, saveCache]);

  // Load Tasks
  const loadTasks = useCallback(async (wsId = workspaceId) => {
    if (!wsId) return;
    try {
      const res = await crmService.getTasks({ workspaceId: wsId });
      const list = res.data || [];
      setTasks(list);
      saveCache('tasks', list, wsId);
    } catch (e) {
      console.warn('Failed to load tasks:', e.message);
    }
  }, [workspaceId, saveCache]);

  // Load Forecast
  const loadForecast = useCallback(async (wsId = workspaceId) => {
    if (!wsId) return;
    try {
      const res = await crmService.getForecast({ workspaceId: wsId });
      setForecast(res.data);
      saveCache('forecast', res.data, wsId);
    } catch (e) {
      console.warn('Failed to load forecast:', e.message);
    }
  }, [workspaceId, saveCache]);

  // Refresh All
  const refreshAll = useCallback(async () => {
    if (!workspaceId) return;
    setRefreshing(true);
    setError(null);
    try {
      await Promise.allSettled([
        loadPipelines(workspaceId),
        loadDeals(workspaceId),
        loadContacts(workspaceId),
        loadAccounts(workspaceId),
        loadTasks(workspaceId),
        loadForecast(workspaceId),
      ]);
    } catch (e) {
      setError(e.message || 'Error refreshing CRM data');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [workspaceId, loadPipelines, loadDeals, loadContacts, loadAccounts, loadTasks, loadForecast]);

  // Hydrate from cache instantly, then revalidate in the background.
  useEffect(() => {
    if (!workspaceId) return;
    let cancelled = false;

    (async () => {
      const [p, d, c, a, t, f] = await Promise.all([
        readCache(`crm:${workspaceId}:pipelines`),
        readCache(`crm:${workspaceId}:deals`),
        readCache(`crm:${workspaceId}:contacts`),
        readCache(`crm:${workspaceId}:accounts`),
        readCache(`crm:${workspaceId}:tasks`),
        readCache(`crm:${workspaceId}:forecast`),
      ]);
      if (cancelled) return;

      if (Array.isArray(p?.data) && p.data.length) {
        setPipelines(p.data);
        setActivePipeline((prev) => {
          if (!prev) return p.data[0];
          return p.data.find((item) => item.id === prev.id) || p.data[0];
        });
      }
      if (Array.isArray(d?.data)) setDeals(d.data);
      if (Array.isArray(c?.data)) setContacts(c.data);
      if (Array.isArray(a?.data)) setAccounts(a.data);
      if (Array.isArray(t?.data)) setTasks(t.data);
      if (f?.data) setForecast(f.data);

      if (p || d || c || a || t || f) setLoading(false);
    })();

    setLoading(true);
    refreshAll();

    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  // Replay queued offline mutations when the network comes back.
  const processSyncQueue = useCallback(async () => {
    if (!workspaceId) return { processed: 0, remaining: 0, offline: true };

    return flushSyncQueue(async (entry) => {
      const params = { workspaceId };
      const payload = entry.payload || {};
      switch (entry.type) {
        case 'createDeal':
          return crmService.createDeal(payload, params);
        case 'updateDeal':
          return crmService.updateDeal(entry.entityId, payload, params);
        case 'moveDealStage':
          return crmService.updateDealStage(entry.entityId, payload.stageId, params);
        case 'deleteDeal':
          return crmService.deleteDeal(entry.entityId, params);
        case 'createContact':
          return crmService.createContact(payload, params);
        case 'updateContact':
          return crmService.updateContact(entry.entityId, payload, params);
        case 'deleteContact':
          return crmService.deleteContact(entry.entityId, params);
        case 'createTask':
          return crmService.createTask(payload, params);
        case 'updateTask':
          return crmService.updateTask(entry.entityId, payload, params);
        case 'deleteTask':
          return crmService.deleteTask(entry.entityId, params);
        default:
          return null;
      }
    });
  }, [workspaceId]);

  useEffect(() => {
    if (!isOnline || !workspaceId) return;
    let cancelled = false;

    (async () => {
      const result = await processSyncQueue();
      if (cancelled) return;
      if (result?.processed > 0) {
        Toast.show({
          type: 'success',
          text1: 'Back online',
          text2: `${result.processed} offline change${result.processed === 1 ? '' : 's'} synced`,
        });
        refreshAll();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOnline, workspaceId, processSyncQueue, refreshAll]);

  const queueOfflineMutation = useCallback(
    (entry) => {
      enqueueMutation({ ...entry, workspaceId });
      Toast.show({
        type: 'info',
        text1: 'Saved offline',
        text2: 'Your change will sync when you reconnect.',
      });
    },
    [workspaceId]
  );

  // Active stages helper
  const stages = activePipeline?.stages || [];

  const openQuickWhatsApp = (contact, deal = null, prefill = '') => {
    setQuickWhatsAppTarget({ contact, deal, message: prefill });
  };

  const closeQuickWhatsApp = () => {
    setQuickWhatsAppTarget(null);
  };

  const openCreateDeal = (defaultStageId = null) => {
    setCreateDealDefaultStageId(defaultStageId);
    setCreateDealVisible(true);
  };

  const openCreateContact = () => {
    setCreateContactVisible(true);
  };

  const openCreateTask = (defaults = {}) => {
    setCreateTaskDefaults(defaults);
    setCreateTaskVisible(true);
  };

  // ==========================================
  // ⚡ OPTIMISTIC MUTATION ENGINE (Zero-Latency)
  // ==========================================

  // --- DEALS ---
  const optimisticAddDeal = useCallback(async (newDealData) => {
    const tempId = `temp-${Date.now()}`;
    const targetStage = stages.find((s) => s.id === newDealData.stageId) || stages[0];
    const optimisticDeal = {
      id: tempId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...newDealData,
      stage: targetStage,
    };

    try {
      HapticsModule?.impactAsync?.(HapticsModule.ImpactFeedbackStyle.Light);
    } catch (_) {}

    setDeals((prev) => [optimisticDeal, ...prev]);

    try {
      const res = await crmService.createDeal(newDealData, { workspaceId });
      if (res?.success && res.data) {
        setDeals((prev) => prev.map((d) => (d.id === tempId ? res.data : d)));
        return res.data;
      }
      throw new Error(res?.error || 'Failed to create deal');
    } catch (err) {
      if (isOfflineError(err)) {
        queueOfflineMutation({ type: 'createDeal', payload: newDealData });
        return optimisticDeal;
      }
      setDeals((prev) => prev.filter((d) => d.id !== tempId));
      Toast.show({ type: 'error', text1: 'Failed to create deal', text2: err.message });
      throw err;
    }
  }, [stages, workspaceId, queueOfflineMutation]);

  const optimisticUpdateDeal = useCallback(async (dealId, patch) => {
    let prevDeals = [];
    setDeals((prev) => {
      prevDeals = prev;
      return prev.map((d) => (d.id === dealId ? { ...d, ...patch } : d));
    });

    try {
      HapticsModule?.selectionAsync?.();
    } catch (_) {}

    try {
      const res = await crmService.updateDeal(dealId, patch, { workspaceId });
      if (!res?.success) throw new Error(res?.error);
      return res.data;
    } catch (err) {
      if (isOfflineError(err)) {
        queueOfflineMutation({ type: 'updateDeal', entityId: dealId, payload: patch });
        return { ...patch, id: dealId };
      }
      setDeals(prevDeals);
      Toast.show({ type: 'error', text1: 'Failed to update deal', text2: err.message });
      throw err;
    }
  }, [workspaceId, queueOfflineMutation]);

  const optimisticMoveDealStage = useCallback(async (dealId, newStageId) => {
    let prevDeals = [];
    const targetStage = stages.find((s) => s.id === newStageId);

    setDeals((prev) => {
      prevDeals = prev;
      return prev.map((d) =>
        d.id === dealId ? { ...d, stageId: newStageId, stage: targetStage || d.stage } : d
      );
    });

    try {
      HapticsModule?.selectionAsync?.();
    } catch (_) {}

    try {
      const res = await crmService.updateDealStage(dealId, newStageId, { workspaceId });
      if (!res?.success) throw new Error(res?.error);
      return res.data;
    } catch (err) {
      if (isOfflineError(err)) {
        queueOfflineMutation({
          type: 'moveDealStage',
          entityId: dealId,
          payload: { stageId: newStageId },
        });
        return { id: dealId, stageId: newStageId };
      }
      setDeals(prevDeals);
      Toast.show({ type: 'error', text1: 'Failed to move deal stage', text2: err.message });
      throw err;
    }
  }, [stages, workspaceId, queueOfflineMutation]);

  const optimisticDeleteDeal = useCallback(async (dealId) => {
    let prevDeals = [];
    setDeals((prev) => {
      prevDeals = prev;
      return prev.filter((d) => d.id !== dealId);
    });

    try {
      HapticsModule?.notificationAsync?.(HapticsModule.NotificationFeedbackType.Success);
    } catch (_) {}

    Toast.show({ type: 'success', text1: 'Deal removed' });

    try {
      const res = await crmService.deleteDeal(dealId, { workspaceId });
      if (!res?.success) throw new Error(res?.error);
      return true;
    } catch (err) {
      if (isOfflineError(err)) {
        queueOfflineMutation({ type: 'deleteDeal', entityId: dealId });
        return true;
      }
      setDeals(prevDeals);
      Toast.show({ type: 'error', text1: 'Failed to delete deal', text2: err.message });
      throw err;
    }
  }, [workspaceId, queueOfflineMutation]);

  // --- CONTACTS ---
  const optimisticAddContact = useCallback(async (newContactData) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticContact = {
      id: tempId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['LEAD'],
      ...newContactData,
    };

    try {
      HapticsModule?.impactAsync?.(HapticsModule.ImpactFeedbackStyle.Light);
    } catch (_) {}

    setContacts((prev) => [optimisticContact, ...prev]);

    try {
      const res = await crmService.createContact(newContactData, { workspaceId });
      if (res?.success && res.data) {
        setContacts((prev) => prev.map((c) => (c.id === tempId ? res.data : c)));
        return res.data;
      }
      throw new Error(res?.error || 'Failed to create contact');
    } catch (err) {
      if (isOfflineError(err)) {
        queueOfflineMutation({ type: 'createContact', payload: newContactData });
        return optimisticContact;
      }
      setContacts((prev) => prev.filter((c) => c.id !== tempId));
      Toast.show({ type: 'error', text1: 'Failed to create contact', text2: err.message });
      throw err;
    }
  }, [workspaceId, queueOfflineMutation]);

  const optimisticUpdateContact = useCallback(async (contactId, patch) => {
    let prevContacts = [];
    setContacts((prev) => {
      prevContacts = prev;
      return prev.map((c) => (c.id === contactId ? { ...c, ...patch } : c));
    });

    try {
      HapticsModule?.selectionAsync?.();
    } catch (_) {}

    try {
      const res = await crmService.updateContact(contactId, patch, { workspaceId });
      if (!res?.success) throw new Error(res?.error);
      return res.data;
    } catch (err) {
      if (isOfflineError(err)) {
        queueOfflineMutation({ type: 'updateContact', entityId: contactId, payload: patch });
        return { ...patch, id: contactId };
      }
      setContacts(prevContacts);
      Toast.show({ type: 'error', text1: 'Failed to update contact', text2: err.message });
      throw err;
    }
  }, [workspaceId, queueOfflineMutation]);

  const optimisticDeleteContact = useCallback(async (contactId) => {
    let prevContacts = [];
    setContacts((prev) => {
      prevContacts = prev;
      return prev.filter((c) => c.id !== contactId);
    });

    try {
      HapticsModule?.notificationAsync?.(HapticsModule.NotificationFeedbackType.Success);
    } catch (_) {}

    Toast.show({ type: 'success', text1: 'Contact removed' });

    try {
      const res = await crmService.deleteContact(contactId, { workspaceId });
      if (!res?.success) throw new Error(res?.error);
      return true;
    } catch (err) {
      if (isOfflineError(err)) {
        queueOfflineMutation({ type: 'deleteContact', entityId: contactId });
        return true;
      }
      setContacts(prevContacts);
      Toast.show({ type: 'error', text1: 'Failed to delete contact', text2: err.message });
      throw err;
    }
  }, [workspaceId, queueOfflineMutation]);

  // --- TASKS ---
  const optimisticAddTask = useCallback(async (newTaskData) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticTask = {
      id: tempId,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...newTaskData,
    };

    try {
      HapticsModule?.impactAsync?.(HapticsModule.ImpactFeedbackStyle.Light);
    } catch (_) {}

    setTasks((prev) => [optimisticTask, ...prev]);

    try {
      const res = await crmService.createTask(newTaskData, { workspaceId });
      if (res?.success && res.data) {
        setTasks((prev) => prev.map((t) => (t.id === tempId ? res.data : t)));
        return res.data;
      }
      throw new Error(res?.error || 'Failed to create task');
    } catch (err) {
      if (isOfflineError(err)) {
        queueOfflineMutation({ type: 'createTask', payload: newTaskData });
        return optimisticTask;
      }
      setTasks((prev) => prev.filter((t) => t.id !== tempId));
      Toast.show({ type: 'error', text1: 'Failed to create task', text2: err.message });
      throw err;
    }
  }, [workspaceId, queueOfflineMutation]);

  const optimisticToggleTask = useCallback(async (taskId, newStatus) => {
    let prevTasks = [];
    setTasks((prev) => {
      prevTasks = prev;
      return prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: newStatus,
              completedAt: newStatus === 'COMPLETED' ? new Date().toISOString() : null,
            }
          : t
      );
    });

    try {
      HapticsModule?.impactAsync?.(HapticsModule.ImpactFeedbackStyle.Medium);
    } catch (_) {}

    Toast.show({
      type: 'success',
      text1: newStatus === 'COMPLETED' ? 'Task completed' : 'Task marked pending',
    });

    try {
      const res = await crmService.updateTask(taskId, { status: newStatus }, { workspaceId });
      if (!res?.success) throw new Error(res?.error);
      return res.data;
    } catch (err) {
      if (isOfflineError(err)) {
        queueOfflineMutation({
          type: 'updateTask',
          entityId: taskId,
          payload: { status: newStatus },
        });
        return { id: taskId, status: newStatus };
      }
      setTasks(prevTasks);
      Toast.show({ type: 'error', text1: 'Failed to update task', text2: err.message });
      throw err;
    }
  }, [workspaceId, queueOfflineMutation]);

  const optimisticDeleteTask = useCallback(async (taskId) => {
    let prevTasks = [];
    setTasks((prev) => {
      prevTasks = prev;
      return prev.filter((t) => t.id !== taskId);
    });

    try {
      HapticsModule?.notificationAsync?.(HapticsModule.NotificationFeedbackType.Success);
    } catch (_) {}

    Toast.show({ type: 'success', text1: 'Task deleted' });

    try {
      const res = await crmService.deleteTask(taskId, { workspaceId });
      if (!res?.success) throw new Error(res?.error);
      return true;
    } catch (err) {
      if (isOfflineError(err)) {
        queueOfflineMutation({ type: 'deleteTask', entityId: taskId });
        return true;
      }
      setTasks(prevTasks);
      Toast.show({ type: 'error', text1: 'Failed to delete task', text2: err.message });
      throw err;
    }
  }, [workspaceId, queueOfflineMutation]);

  return (
    <CrmContext.Provider
      value={{
        workspaceId,
        pipelines,
        activePipeline,
        setActivePipeline,
        stages,
        deals,
        setDeals,
        contacts,
        setContacts,
        accounts,
        setAccounts,
        tasks,
        setTasks,
        forecast,
        loading,
        refreshing,
        error,
        loadPipelines,
        loadDeals,
        loadContacts,
        loadAccounts,
        loadTasks,
        loadForecast,
        refreshAll,
        // Optimistic Mutation Engine
        optimisticAddDeal,
        optimisticUpdateDeal,
        optimisticMoveDealStage,
        optimisticDeleteDeal,
        optimisticAddContact,
        optimisticUpdateContact,
        optimisticDeleteContact,
        optimisticAddTask,
        optimisticToggleTask,
        optimisticDeleteTask,
        // Modals
        quickWhatsAppTarget,
        openQuickWhatsApp,
        closeQuickWhatsApp,
        createDealVisible,
        setCreateDealVisible,
        createDealDefaultStageId,
        openCreateDeal,
        createContactVisible,
        setCreateContactVisible,
        openCreateContact,
        createTaskVisible,
        setCreateTaskVisible,
        createTaskDefaults,
        openCreateTask,
      }}
    >
      {children}
    </CrmContext.Provider>
  );
}

export function useCrm() {
  const ctx = useContext(CrmContext);
  if (!ctx) {
    throw new Error('useCrm must be used within a CrmProvider');
  }
  return ctx;
}
