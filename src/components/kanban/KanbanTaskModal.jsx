import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '~/theme/AppTheme';
import * as kanbanService from '~/services/kanban/kanban';

const priorityOptions = ['low', 'medium', 'high', 'urgent'];
const typeOptions = ['task', 'article', 'social', 'note'];
const priorityColors = { urgent: '#e11d48', high: '#f59e0b', medium: '#3b82f6', low: '#10b981' };
const typeColors = { task: '#6366f1', article: '#3b82f6', social: '#8b5cf6', note: '#f59e0b' };

export default function KanbanTaskModal({ visible, workspaceId, columnId, task, onClose, onSaved, columns, onMoveTask }) {
  const { palette, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const isEdit = !!task;
  const [activeTab, setActiveTab] = useState('details');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [taskType, setTaskType] = useState('task');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [checklists, setChecklists] = useState([]);
  const [newChecklist, setNewChecklist] = useState('');
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    if (visible) {
      if (task) {
        setTitle(task.title || '');
        setContent(task.content || '');
        setTaskType(task.type || 'task');
        setPriority(task.priority || 'medium');
        setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
        setCoverUrl(task.coverUrl || '');
        setChecklists(task.checklists || []);
        setActivities(task.activities || []);
      } else {
        setTitle('');
        setContent('');
        setTaskType('task');
        setPriority('medium');
        setDueDate('');
        setCoverUrl('');
        setChecklists([]);
        setActivities([]);
      }
      setActiveTab('details');
    }
  }, [visible, task]);

  const canSave = title.trim().length > 0;

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      let result;
      if (isEdit) {
        const payload = { title: title.trim(), content: content || null, type: taskType, priority, dueDate: dueDate || null, coverUrl: coverUrl || null };
        result = await kanbanService.updateTask(task.id, payload);
      } else {
        const payload = { workspaceId, columnId, title: title.trim(), content: content || null, type: taskType, priority, dueDate: dueDate || null, coverUrl: coverUrl || null };
        if (checklists.length > 0) payload.checklists = checklists.map(c => ({ title: c.title || c }));
        result = await kanbanService.createTask(payload);
      }
      const savedTask = result?.data?.task;
      if (onSaved) onSaved(savedTask);
    } catch (e) {
      console.error('save task error', e);
      Alert.alert('Error', 'Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateDescription = async () => {
    if (!title.trim()) { Alert.alert('Error', 'Enter a title first'); return; }
    setGenerating(true);
    try {
      const result = await kanbanService.generateAiDescription({ title: title.trim(), type: taskType });
      if (result?.data?.description) setContent(result.data.description);
    } catch (e) {
      console.error('AI gen error', e);
    } finally {
      setGenerating(false);
    }
  };

  const addChecklistItem = () => {
    const text = newChecklist.trim();
    if (!text) return;
    if (!isEdit) {
      setChecklists(prev => [...prev, { id: Date.now().toString(), title: text, completed: false }]);
      setNewChecklist('');
      return;
    }
    kanbanService.createChecklistItem(task.id, { title: text }).then(res => {
      if (res?.data?.item) setChecklists(prev => [...prev, res.data.item]);
      setNewChecklist('');
    }).catch(e => console.error(e));
  };

  const toggleChecklist = async (item) => {
    const newCompleted = !item.completed;
    setChecklists(prev => prev.map(c => c.id === item.id ? { ...c, completed: newCompleted } : c));
    if (isEdit) {
      kanbanService.updateChecklistItem(task.id, item.id, { completed: newCompleted }).catch(e => console.error(e));
    }
  };

  const deleteChecklist = async (itemId) => {
    setChecklists(prev => prev.filter(c => c.id !== itemId));
    if (isEdit) {
      kanbanService.deleteChecklistItem(task.id, itemId).catch(e => console.error(e));
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable className="absolute inset-0 bg-black/50" onPress={onClose} />
        <View className="flex-1 justify-end px-0" pointerEvents="box-none">
          <View className="rounded-t-3xl overflow-hidden flex-col" style={{ flex: 1, maxHeight: '85%', backgroundColor: palette.colors.page }}>
            <View className="flex-row items-center justify-between px-5 py-4" style={{ borderBottomWidth: 1, borderBottomColor: palette.colors.border }}>
              <View className="flex-row items-center gap-3">
                <View className="p-2 rounded-xl" style={{ backgroundColor: isDark ? 'rgba(20,184,166,0.15)' : 'rgba(20,184,166,0.1)' }}>
                  <Ionicons name={isEdit ? 'create-outline' : 'add'} size={18} color="#14b8a6" />
                </View>
                <Text className="text-[18px] font-bold" style={{ color: palette.textColor }}>{isEdit ? 'Edit Task' : 'New Task'}</Text>
              </View>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color={palette.textColor} />
              </TouchableOpacity>
            </View>

            <View className="flex-row px-5 pt-3 pb-2 gap-1">
              {[
                { key: 'details', icon: 'document-text-outline', label: 'Details' },
                { key: 'checklist', icon: 'checkbox-outline', label: 'Checklist' },
                { key: 'activity', icon: 'time-outline', label: 'Activity' },
              ].map(tab => (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key)}
                  className="flex-1 py-2.5 rounded-xl flex-row items-center justify-center gap-1.5"
                  style={{ backgroundColor: activeTab === tab.key ? (isDark ? '#334155' : '#e2e8f0') : 'transparent' }}
                >
                  <Ionicons name={tab.icon} size={14} color={activeTab === tab.key ? palette.textColor : palette.textMutedColor} />
                  <Text className="text-[11px] font-bold" style={{ color: activeTab === tab.key ? palette.textColor : palette.textMutedColor }}>{tab.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <ScrollView className="flex-1 px-5 pt-2" contentContainerStyle={{ paddingBottom: 20 }} keyboardShouldPersistTaps="handled">
            {activeTab === 'details' && (
              <View className="gap-4">
                <View>
                  <Text className="text-[10px] font-bold mb-1.5 uppercase tracking-wider" style={{ color: palette.textMutedColor }}>Title</Text>
                  <TextInput
                    className="h-12 px-4 rounded-2xl text-[14px] font-bold"
                    style={{ backgroundColor: palette.colors.surfaceMuted, color: palette.textColor }}
                    placeholder="What needs to be done?"
                    placeholderTextColor={palette.textMutedColor}
                    value={title}
                    onChangeText={setTitle}
                  />
                </View>

                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Text className="text-[10px] font-bold mb-1.5 uppercase tracking-wider" style={{ color: palette.textMutedColor }}>Type</Text>
                    <View className="flex-row gap-1.5 flex-wrap">
                      {typeOptions.map(t => (
                        <TouchableOpacity key={t} onPress={() => setTaskType(t)}
                          className="px-3 py-2 rounded-xl flex-row items-center gap-1"
                          style={{ backgroundColor: taskType === t ? (typeColors[t] + '20') : palette.colors.surfaceMuted, borderWidth: 1, borderColor: taskType === t ? typeColors[t] + '40' : 'transparent' }}>
                          <Text className="text-[11px] font-bold capitalize" style={{ color: taskType === t ? typeColors[t] : palette.textMutedColor }}>{t}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  <View className="flex-1">
                    <Text className="text-[10px] font-bold mb-1.5 uppercase tracking-wider" style={{ color: palette.textMutedColor }}>Priority</Text>
                    <View className="flex-row gap-1.5 flex-wrap">
                      {priorityOptions.map(p => (
                        <TouchableOpacity key={p} onPress={() => setPriority(p)}
                          className="px-3 py-2 rounded-xl"
                          style={{ backgroundColor: priority === p ? (priorityColors[p] + '20') : palette.colors.surfaceMuted, borderWidth: 1, borderColor: priority === p ? priorityColors[p] + '40' : 'transparent' }}>
                          <Text className="text-[11px] font-bold capitalize" style={{ color: priority === p ? priorityColors[p] : palette.textMutedColor }}>{p}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>

                <View>
                  <Text className="text-[10px] font-bold mb-1.5 uppercase tracking-wider" style={{ color: palette.textMutedColor }}>Due Date</Text>
                  <TextInput
                    className="h-12 px-4 rounded-2xl text-[14px]"
                    style={{ backgroundColor: palette.colors.surfaceMuted, color: palette.textColor }}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={palette.textMutedColor}
                    value={dueDate}
                    onChangeText={setDueDate}
                  />
                </View>

                <View>
                  <View className="flex-row items-center justify-between mb-1.5">
                    <Text className="text-[10px] font-bold uppercase tracking-wider" style={{ color: palette.textMutedColor }}>Description</Text>
                    <TouchableOpacity onPress={handleGenerateDescription} disabled={generating || !title.trim()}
                      className="flex-row items-center gap-1 px-2.5 py-1.5 rounded-lg"
                      style={{ backgroundColor: isDark ? 'rgba(20,184,166,0.1)' : 'rgba(20,184,166,0.08)' }}>
                      {generating ? (
                        <ActivityIndicator size={10} color="#14b8a6" />
                      ) : (
                        <Ionicons name="sparkles" size={12} color="#14b8a6" />
                      )}
                      <Text className="text-[9px] font-bold text-teal-600">AI</Text>
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    className="px-4 py-3 rounded-2xl text-[13px] min-h-[100px]"
                    style={{ backgroundColor: palette.colors.surfaceMuted, color: palette.textColor }}
                    placeholder="Add details..."
                    placeholderTextColor={palette.textMutedColor}
                    value={content}
                    onChangeText={setContent}
                    multiline
                    textAlignVertical="top"
                  />
                </View>

                {isEdit && columns && columns.length > 0 && (
                  <View>
                    <Text className="text-[10px] font-bold mb-1.5 uppercase tracking-wider" style={{ color: palette.textMutedColor }}>Move to Column</Text>
                    <View className="flex-row gap-1.5 flex-wrap">
                      {columns.filter(c => c.id !== task?.columnId).map(col => (
                        <TouchableOpacity key={col.id} onPress={() => {
                          if (onMoveTask) {
                            onMoveTask(task.id, col.id);
                            onClose();
                          }
                        }} className="px-3 py-2 rounded-xl flex-row items-center gap-1" style={{ backgroundColor: palette.colors.surfaceMuted }}>
                          <Ionicons name="arrow-forward" size={12} color={palette.textMutedColor} />
                          <Text className="text-[11px] font-bold" style={{ color: palette.textMutedColor }} numberOfLines={1}>{col.title}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}

            {activeTab === 'checklist' && (
              <View className="gap-3">
                <View className="flex-row gap-2">
                  <TextInput
                    className="flex-1 h-11 px-4 rounded-2xl text-[13px]"
                    style={{ backgroundColor: palette.colors.surfaceMuted, color: palette.textColor }}
                    placeholder="Add sub-task..."
                    placeholderTextColor={palette.textMutedColor}
                    value={newChecklist}
                    onChangeText={setNewChecklist}
                    onSubmitEditing={addChecklistItem}
                  />
                  <TouchableOpacity onPress={addChecklistItem} disabled={!newChecklist.trim()}
                    className="w-11 items-center justify-center rounded-2xl bg-teal-600">
                    <Ionicons name="add" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>

                {checklists.length === 0 && (
                  <View className="py-10 items-center">
                    <Ionicons name="checkbox-outline" size={32} color={palette.textMutedColor + '60'} />
                    <Text className="text-[11px] mt-2" style={{ color: palette.textMutedColor }}>No sub-tasks yet</Text>
                  </View>
                )}

                {checklists.map(item => (
                  <View key={item.id} className="flex-row items-center gap-3 p-3 rounded-2xl" style={{ backgroundColor: palette.colors.surfaceMuted }}>
                    <TouchableOpacity onPress={() => toggleChecklist(item)}
                      className="h-5 w-5 rounded-md items-center justify-center"
                      style={{ backgroundColor: item.completed ? '#14b8a6' : 'transparent', borderWidth: 2, borderColor: item.completed ? '#14b8a6' : palette.colors.border }}>
                      {item.completed && <Ionicons name="checkmark" size={12} color="#fff" />}
                    </TouchableOpacity>
                    <Text className="flex-1 text-[13px] font-bold" style={{ color: item.completed ? palette.textMutedColor : palette.textColor, textDecorationLine: item.completed ? 'line-through' : 'none' }}>
                      {item.title}
                    </Text>
                    <TouchableOpacity onPress={() => deleteChecklist(item.id)}>
                      <Ionicons name="trash-outline" size={16} color="#e11d48" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {activeTab === 'activity' && (
              <View>
                {activities.length === 0 && (
                  <View className="py-10 items-center">
                    <Ionicons name="time-outline" size={32} color={palette.textMutedColor + '60'} />
                    <Text className="text-[11px] mt-2" style={{ color: palette.textMutedColor }}>No activity recorded</Text>
                  </View>
                )}
                {activities.map(act => (
                  <View key={act.id} className="flex-row gap-3 mb-4 pl-3" style={{ borderLeftWidth: 2, borderLeftColor: palette.colors.border + '40' }}>
                    <View>
                      <Text className="text-[12px] font-bold" style={{ color: palette.textColor }}>{act.user?.displayName || 'System'}</Text>
                      <Text className="text-[9px] mt-0.5" style={{ color: palette.textMutedColor }}>{act.description}</Text>
                      <Text className="text-[8px] mt-1" style={{ color: palette.textMutedColor + '80' }}>{new Date(act.createdAt).toLocaleString()}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          <View className="px-5 py-4 gap-2" style={{ borderTopWidth: 1, borderTopColor: palette.colors.border, paddingBottom: insets.bottom + 12 }}>
            {isEdit && (
              <TouchableOpacity onPress={() => {
                Alert.alert('Delete Task', 'Are you sure?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: async () => {
                    try {
                      await kanbanService.deleteTask(task.id);
                      if (onSaved) onSaved(null);
                    } catch (e) { console.error(e); }
                  }},
                ]);
              }} className="h-11 rounded-2xl items-center justify-center flex-row gap-2" style={{ backgroundColor: 'rgba(225,29,72,0.1)' }}>
                <Ionicons name="trash-outline" size={16} color="#e11d48" />
                <Text className="text-[13px] font-bold text-rose-600">Delete Task</Text>
              </TouchableOpacity>
            )}
            <View className="flex-row gap-3">
              <TouchableOpacity onPress={onClose} className="flex-1 h-12 rounded-2xl items-center justify-center" style={{ backgroundColor: palette.colors.surfaceMuted }}>
                <Text className="text-[13px] font-bold" style={{ color: palette.textMutedColor }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} disabled={!canSave || saving}
                className="flex-1 h-12 rounded-2xl items-center justify-center flex-row gap-2"
                style={{ backgroundColor: !canSave || saving ? (isDark ? '#334155' : '#cbd5e1') : '#14b8a6' }}>
                {saving ? <ActivityIndicator size={16} color="#fff" /> : null}
                <Text className="text-[13px] font-bold" style={{ color: !canSave || saving ? palette.textMutedColor : '#fff' }}>
                  {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Task'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
