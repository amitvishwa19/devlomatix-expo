import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import { sendCopilotMessage } from '~/services/copilotStream';

const REVEAL_DELAY = 12;

function buildWelcome(dealsCount = 0, pipelineValue = 0) {
  return {
    id: 'welcome',
    role: 'assistant',
    content: `👋 Hello! I am **FlowGenix Sales Copilot**.\n\nI have real-time visibility into your **${dealsCount} active opportunities** (₹ ${Number(
      pipelineValue || 0
    ).toLocaleString('en-IN')} total pipeline).\n\nAsk me for closing strategies, pitch drafts, deal health diagnostics, or objection handling!`,
    createdAt: new Date().toISOString(),
  };
}

function tokenize(text) {
  return String(text || '').match(/\S+\s*|\n/g) || [];
}

export function useCopilotChat({ workspaceId, deals = [], forecast } = {}) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [streamingId, setStreamingId] = useState(null);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState(null);

  const cancelledRef = useRef(false);
  const unmountedRef = useRef(false);
  const timersRef = useRef(new Set());
  const messagesRef = useRef([]);

  const pipelineValue =
    forecast?.summary?.totalPipelineValue ||
    deals.reduce((sum, deal) => sum + (parseFloat(deal.value) || 0), 0);

  const welcomeRef = useRef(buildWelcome(deals.length, pipelineValue));
  welcomeRef.current = buildWelcome(deals.length, pipelineValue);

  const storageKey = workspaceId ? `devlomatix.copilot.${workspaceId}` : null;

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    unmountedRef.current = false;
    let cancelled = false;
    setHydrated(false);

    if (!storageKey) {
      setMessages([welcomeRef.current]);
      setHydrated(true);
      return () => {
        cancelled = true;
      };
    }

    AsyncStorage.getItem(storageKey)
      .then((raw) => {
        if (cancelled) return;
        let stored = null;
        try {
          stored = raw ? JSON.parse(raw) : null;
        } catch (_) {}
        setMessages(Array.isArray(stored) && stored.length ? stored : [welcomeRef.current]);
      })
      .catch(() => {
        if (!cancelled) setMessages([welcomeRef.current]);
      })
      .finally(() => {
        if (!cancelled) setHydrated(true);
      });

    return () => {
      cancelled = true;
    };
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated || !storageKey) return;
    const persistable = messages.map(({ pending, ...message }) => message);
    AsyncStorage.setItem(storageKey, JSON.stringify(persistable)).catch(() => {});
  }, [messages, hydrated, storageKey]);

  useEffect(
    () => () => {
      unmountedRef.current = true;
      cancelledRef.current = true;
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current.clear();
    },
    []
  );

  const cancelReveal = useCallback(() => {
    cancelledRef.current = true;
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current.clear();
    setMessages((prev) =>
      prev.map((message) => (message.pending ? { ...message, pending: false } : message))
    );
    setStreamingId(null);
    setLoading(false);
  }, []);

  const reveal = useCallback((messageId, text) => {
    return new Promise((resolve) => {
      cancelledRef.current = false;
      const tokens = tokenize(text);

      if (!tokens.length) {
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, content: text || '', pending: false } : m))
        );
        resolve();
        return;
      }

      let index = 0;
      let buffer = '';
      setStreamingId(messageId);

      const step = () => {
        if (cancelledRef.current || unmountedRef.current) {
          setStreamingId(null);
          resolve();
          return;
        }

        buffer += tokens[index];
        index += 1;
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, content: buffer, pending: false } : m))
        );

        if (index >= tokens.length) {
          setStreamingId(null);
          resolve();
          return;
        }

        const timer = setTimeout(step, REVEAL_DELAY);
        timersRef.current.add(timer);
      };

      step();
    });
  }, []);

  const send = useCallback(
    async (rawQuery, options = {}) => {
      const query = String(rawQuery || '').trim();
      if (!query || loading) return;

      cancelledRef.current = false;

      const baseHistory = Array.isArray(options.history)
        ? options.history
        : messagesRef.current;

      const userMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: query,
        createdAt: new Date().toISOString(),
      };
      const assistantId = `assistant-${Date.now() + 1}`;
      const nextHistory = [...baseHistory, userMessage];

      setError(null);
      setMessages([
        ...nextHistory,
        {
          id: assistantId,
          role: 'assistant',
          content: '',
          pending: true,
          createdAt: new Date().toISOString(),
        },
      ]);
      setLoading(true);

      try {
        const res = await sendCopilotMessage({
          message: query,
          history: nextHistory.map(({ role, content }) => ({ role, content })),
          params: workspaceId ? { workspaceId } : {},
        });

        if (!res.success || !res.reply) {
          throw new Error(res.error || 'Copilot did not return a reply.');
        }

        await reveal(assistantId, res.reply);

        if (res.actions?.length) {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, actions: res.actions } : m))
          );
        }
      } catch (err) {
        setError(err?.message || 'Copilot is unavailable right now.');
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  pending: false,
                  content: `⚠️ ${err?.message || 'Something went wrong. Please try again.'}`,
                }
              : m
          )
        );
        setStreamingId(null);
      } finally {
        setLoading(false);
      }
    },
    [loading, reveal, workspaceId]
  );

  const stop = useCallback(() => {
    cancelReveal();
  }, [cancelReveal]);

  const clear = useCallback(() => {
    cancelReveal();
    setError(null);
    setMessages([welcomeRef.current]);
    if (storageKey) {
      AsyncStorage.setItem(storageKey, JSON.stringify([welcomeRef.current])).catch(() => {});
    }
  }, [cancelReveal, storageKey]);

  const regenerate = useCallback(() => {
    const current = messagesRef.current;
    const lastUserIndex = current.map((m) => m.role).lastIndexOf('user');
    if (lastUserIndex < 0) return;
    const lastUser = current[lastUserIndex];
    const history = current.slice(0, lastUserIndex);
    send(lastUser.content, { history });
  }, [send]);

  return {
    messages,
    loading,
    streamingId,
    hydrated,
    error,
    send,
    stop,
    clear,
    regenerate,
    isStreaming: Boolean(streamingId),
  };
}
