import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { resolveWorkspaceId } from '~/utils/workspace';
import * as crmService from '~/services/crm';

export const CrmContext = createContext(null);

export function CrmProvider({ children, workspaceId: propWorkspaceId }) {
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

  // Load Pipelines
  const loadPipelines = useCallback(async (wsId = workspaceId) => {
    if (!wsId) return;
    try {
      const res = await crmService.getPipelines({ workspaceId: wsId });
      const pipeList = res.data || [];
      setPipelines(pipeList);
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
      setDeals(res.data || []);
    } catch (e) {
      console.warn('Failed to load deals:', e.message);
    }
  }, [workspaceId, activePipeline?.id]);

  // Load Contacts
  const loadContacts = useCallback(async (wsId = workspaceId) => {
    if (!wsId) return;
    try {
      const res = await crmService.getContacts({ workspaceId: wsId });
      setContacts(res.data || []);
    } catch (e) {
      console.warn('Failed to load contacts:', e.message);
    }
  }, [workspaceId]);

  // Load Accounts
  const loadAccounts = useCallback(async (wsId = workspaceId) => {
    if (!wsId) return;
    try {
      const res = await crmService.getAccounts({ workspaceId: wsId });
      setAccounts(res.data || []);
    } catch (e) {
      console.warn('Failed to load accounts:', e.message);
    }
  }, [workspaceId]);

  // Load Tasks
  const loadTasks = useCallback(async (wsId = workspaceId) => {
    if (!wsId) return;
    try {
      const res = await crmService.getTasks({ workspaceId: wsId });
      setTasks(res.data || []);
    } catch (e) {
      console.warn('Failed to load tasks:', e.message);
    }
  }, [workspaceId]);

  // Load Forecast
  const loadForecast = useCallback(async (wsId = workspaceId) => {
    if (!wsId) return;
    try {
      const res = await crmService.getForecast({ workspaceId: wsId });
      setForecast(res.data);
    } catch (e) {
      console.warn('Failed to load forecast:', e.message);
    }
  }, [workspaceId]);

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

  useEffect(() => {
    if (workspaceId) {
      setLoading(true);
      refreshAll();
    }
  }, [workspaceId]);

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

  return (
    <CrmContext.Provider
      value={{
        workspaceId,
        pipelines,
        activePipeline,
        setActivePipeline,
        stages,
        deals,
        contacts,
        accounts,
        tasks,
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
