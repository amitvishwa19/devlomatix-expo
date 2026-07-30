import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, RefreshControl, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useAppTheme } from '~/theme/AppTheme';

import KonnectxEmptyState from '~/components/konnectx/KonnectxEmptyState';
import { SkeletonCard } from '~/components/konnectx/KonnectxLoadingSkeleton';
import { useKonnectx } from '~/providers/KonnectxProvider';
import * as templatesService from '~/services/konnectx/templates';
import TemplateBuilder from './_components/TemplateBuilder';
import ShareTemplateDialog from './_components/ShareTemplateDialog';
import TestTemplateDialog from './_components/TestTemplateDialog';
import TemplatePreview from './_components/TemplatePreview';

const STATUS_STYLES = {
  APPROVED: { color: '#16a34a', bg: 'rgba(22,163,74,0.1)', label: 'Approved' },
  PENDING_APPROVAL: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'In Review' },
  PENDING: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'In Review' },
  IN_APPEAL: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'In Review' },
  REJECTED: { color: '#dc2626', bg: 'rgba(220,38,38,0.1)', label: 'Rejected' },
  DRAFT: { color: '#6b7280', bg: 'rgba(107,114,128,0.1)', label: 'Draft' },
  PAUSED: { color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', label: 'Paused' },
};

export default function TemplatesScreen() {
  const { palette } = useAppTheme();
  const router = useRouter();
  const { userId, selectedCredential } = useKonnectx();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSubmittingId, setIsSubmittingId] = useState(null);
  const [isDeletingId, setIsDeletingId] = useState(null);

  const [showBuilder, setShowBuilder] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [showSend, setShowSend] = useState(false);
  const [testingTemplate, setTestingTemplate] = useState(null);

  const [showPreview, setShowPreview] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState(null);

  const [showShare, setShowShare] = useState(false);
  const [shareTemplate, setShareTemplate] = useState(null);

  const fetchTemplates = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await templatesService.getTemplates(userId);
      console.log('[Templates] API response:', JSON.stringify(data).slice(0, 500));
      const parsed = (Array.isArray(data) ? data : data?.templates ?? []).map(t => {
        const n = { ...t };
        if (typeof n.metadata === 'string' && n.metadata.trim().startsWith('{')) {
          try { n.metadata = JSON.parse(n.metadata); } catch { }
        }
        if (typeof n.buttons === 'string' && n.buttons.trim().startsWith('[')) {
          try { n.buttons = JSON.parse(n.buttons); } catch { }
        }
        return n;
      });
      setTemplates(parsed);
    } catch (err) {
      console.error('[Templates] fetch error:', err?.response?.status, err?.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) fetchTemplates();
  }, [userId, fetchTemplates]);

  const onRefresh = useCallback(async () => {
    if (!userId) return;
    setRefreshing(true);
    await fetchTemplates();
    await templatesService.syncTemplates(userId).catch(() => { });
    await fetchTemplates();
    setRefreshing(false);
  }, [userId, fetchTemplates]);

  const handleSync = async () => {
    if (!userId) return;
    setIsSyncing(true);
    try {
      await templatesService.syncTemplates(userId);
      Toast.show({ type: 'success', text1: 'Synced', text2: 'Templates synced from Meta' });
      fetchTemplates();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Sync failed', text2: err?.response?.data?.error || err.message });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleOpenBuilder = (template = null) => {
    setEditingTemplate(template);
    setShowBuilder(true);
  };

  const handleSaveComplete = () => {
    setShowBuilder(false);
    setEditingTemplate(null);
    fetchTemplates();
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Delete Template',
      'This will permanently delete this template. If submitted to Meta, it will also be removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: async () => {
            setIsDeletingId(id);
            try {
              await templatesService.deleteTemplate(userId, id);
              setTemplates(prev => prev.filter(t => t.id !== id));
              Toast.show({ type: 'success', text1: 'Deleted' });
            } catch (err) {
              Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.error || err.message });
            } finally {
              setIsDeletingId(null);
            }
          }
        }
      ]
    );
  };

  const handleSubmit = async (id) => {
    setIsSubmittingId(id);
    try {
      await templatesService.submitTemplate(userId, id, selectedCredential?.wabaId);
      Toast.show({ type: 'success', text1: 'Submitted', text2: 'Template sent for review' });
      fetchTemplates();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.error || err.message });
    } finally {
      setIsSubmittingId(null);
    }
  };

  const handleCheckStatus = async (id) => {
    setIsSubmittingId(id);
    try {
      const res = await templatesService.checkTemplateStatus(userId, id, selectedCredential?.wabaId);
      Toast.show({ type: 'success', text1: 'Status checked', text2: `Status: ${res.status || 'updated'}` });
      fetchTemplates();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.error || err.message });
    } finally {
      setIsSubmittingId(null);
    }
  };

  const handleClone = async (template) => {
    try {
      if (template.isDefault) {
        handleOpenBuilder({
          ...template,
          id: null,
          name: `${template.name} Copy`,
          status: 'DRAFT',
          templateId: null,
          approved: false,
          isDefault: false,
        });
      } else {
        const res = await templatesService.cloneTemplate(userId, template.id);
        Toast.show({ type: 'success', text1: 'Cloned', text2: 'Template duplicated' });
        fetchTemplates();
      }
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.error || err.message });
    }
  };

  const handleTest = (template) => {
    setTestingTemplate(template);
    setShowSend(true);
  };

  const handlePreview = (template) => {
    setPreviewTemplate(template);
    setShowPreview(true);
  };

  const handleShare = (template) => {
    setShareTemplate(template);
    setShowShare(true);
  };

  const filtered = templates.filter(t =>
    !search || t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.category?.toLowerCase().includes(search.toLowerCase())
  );

  const canSubmit = (t) => t.platform === 'WHATSAPP_CLOUD' && (!t.status || t.status === 'DRAFT' || t.status === 'REJECTED');
  const canCheckStatus = (t) => t.platform === 'WHATSAPP_CLOUD' && (t.status === 'PENDING_APPROVAL' || t.status === 'PENDING' || t.status === 'IN_APPEAL');

  const renderItem = ({ item }) => {
    const st = STATUS_STYLES[item.status] || STATUS_STYLES.DRAFT;
    return (
      <View className="mb-3 rounded-lg border p-4" style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border }}>
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <Text className={`text-[16px] font-bold flex-1 ${palette.text}`}>{item.name}</Text>
              <View className="rounded-full px-2.5 py-0.5" style={{ backgroundColor: st.bg }}>
                <Text style={{ color: st.color, fontSize: 9, fontWeight: '800' }}>{st.label}</Text>
              </View>
            </View>
            <Text className={`mt-1 text-[12px] ${palette.textSoft}`}>{item.category} · {item.type} · {item.language}</Text>
          </View>
        </View>

        {item.body ? (
          <Text className={`mt-2 text-[13px] leading-5 ${palette.textMuted}`} numberOfLines={2}>{item.body}</Text>
        ) : null}

        <View className="mt-3 flex-row flex-wrap gap-2">
          <TouchableOpacity onPress={() => handleTest(item)}
            className="flex-1 items-center rounded-xl bg-sky-600 py-2.5">
            <Text className="text-[12px] font-bold text-white">Send</Text>
          </TouchableOpacity>

          {canSubmit(item) ? (
            <TouchableOpacity onPress={() => handleSubmit(item.id)} disabled={isSubmittingId === item.id}
              className="items-center rounded-xl border px-4 py-2.5" style={{ borderColor: palette.colors.border }}>
              <Ionicons name={isSubmittingId === item.id ? 'hourglass' : 'paper-plane-outline'} size={16} color={palette.textMutedColor} />
            </TouchableOpacity>
          ) : null}

          {canCheckStatus(item) ? (
            <TouchableOpacity onPress={() => handleCheckStatus(item.id)} disabled={isSubmittingId === item.id}
              className="items-center rounded-xl border px-4 py-2.5" style={{ borderColor: palette.colors.border }}>
              <Ionicons name={isSubmittingId === item.id ? 'hourglass' : 'sync-outline'} size={16} color={palette.textMutedColor} />
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity onPress={() => handlePreview(item)}
            className="items-center rounded-xl border px-4 py-2.5" style={{ borderColor: palette.colors.border }}>
            <Ionicons name="eye-outline" size={16} color={palette.textMutedColor} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => handleClone(item)}
            className="items-center rounded-xl border px-4 py-2.5" style={{ borderColor: palette.colors.border }}>
            <Ionicons name="copy-outline" size={16} color={palette.textMutedColor} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => handleShare(item)}
            className="items-center rounded-xl border px-4 py-2.5" style={{ borderColor: palette.colors.border }}>
            <Ionicons name="share-outline" size={16} color={palette.textMutedColor} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => handleDelete(item.id)} disabled={isDeletingId === item.id}
            className="items-center rounded-xl border border-red-500/20 px-4 py-2.5"
            style={{ backgroundColor: 'rgba(220,38,38,0.05)' }}>
            <Ionicons name={isDeletingId === item.id ? 'hourglass' : 'trash-outline'} size={16} color="#dc2626" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: palette.colors.page }}>
      <View className="flex-1 px-4 pt-5">
        <View className="mb-4 flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={palette.textColor} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-[28px] font-bold" style={{ color: palette.textColor }}>Templates</Text>
            <Text className={`text-[13px] ${palette.textSoft}`}>{templates.length} template{templates.length !== 1 ? 's' : ''}</Text>
          </View>
          <TouchableOpacity onPress={handleSync} disabled={isSyncing}
            className="rounded-full border px-4 py-3" style={{ borderColor: palette.colors.border }}>
            <Ionicons name={isSyncing ? 'hourglass' : 'sync-outline'} size={20} color={palette.textColor} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleOpenBuilder()}
            className="rounded-full bg-sky-600 px-4 py-3">
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <View className="mb-4 flex-row items-center rounded-[20px] border px-4 py-3"
          style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border }}>
          <Ionicons name="search" size={18} color={palette.textMutedColor} />
          <TextInput className="ml-2 flex-1 text-[14px]" style={{ color: palette.textColor }}
            placeholder="Search templates..." placeholderTextColor={palette.textMutedColor}
            value={search} onChangeText={setSearch} />
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id?.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.textColor} />}
          ListEmptyComponent={
            loading ? <><SkeletonCard /><SkeletonCard /></> : (
              <KonnectxEmptyState icon="document-text-outline" title="No templates"
                description="Sync from Meta or create your first message template."
                ctaLabel="Create Template" onCtaPress={() => handleOpenBuilder()} />
            )
          }
          renderItem={renderItem}
        />
      </View>

      <TemplateBuilder
        visible={showBuilder}
        onClose={() => { setShowBuilder(false); setEditingTemplate(null); }}
        onSave={handleSaveComplete}
        editingTemplate={editingTemplate}
        userId={userId}
        selectedCredential={selectedCredential}
      />

      {testingTemplate && (
        <TestTemplateDialog
          visible={showSend}
          onClose={() => { setShowSend(false); setTestingTemplate(null); }}
          template={testingTemplate}
          userId={userId}
        />
      )}

      {previewTemplate && (
        <TemplatePreview
          visible={showPreview}
          onClose={() => { setShowPreview(false); setPreviewTemplate(null); }}
          template={previewTemplate}
        />
      )}

      {shareTemplate && (
        <ShareTemplateDialog
          visible={showShare}
          onClose={() => { setShowShare(false); setShareTemplate(null); }}
          template={shareTemplate}
          userId={userId}
          onUpdate={fetchTemplates}
        />
      )}
    </SafeAreaView>
  );
}
