import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Pressable, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '~/theme/AppTheme';
import * as kanbanService from '~/services/kanban/kanban';
import KanbanTaskModal from '~/components/kanban/KanbanTaskModal';
import AddKanbanColumnModal from '~/components/kanban/AddKanbanColumnModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COL_WIDTH = SCREEN_WIDTH * 0.72;

const priorityColors = { urgent: '#e11d48', high: '#f59e0b', medium: '#3b82f6', low: '#10b981' };
const typeColors = { task: '#6366f1', article: '#3b82f6', social: '#8b5cf6', note: '#f59e0b' };
const typeIcons = { task: 'checkbox-outline', article: 'document-text-outline', social: 'share-outline', note: 'create-outline' };

export default function KanbanBoard({ workspaceId: externalWorkspaceId }) {
  const { palette, isDark } = useAppTheme();
  const [data, setData] = useState({ tasks: {}, columns: {}, columnOrder: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [taskModal, setTaskModal] = useState({ visible: false, columnId: null, task: null });
  const [columnModal, setColumnModal] = useState(false);

  const workspaceId = externalWorkspaceId;

  const fetchData = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const res = await kanbanService.fetchBoard(workspaceId);
      const columns = res?.data?.columns || [];
      const tasksMap = {};
      const columnsMap = {};
      const columnOrder = [];
      columns.forEach(col => {
        columnsMap[col.id] = { id: col.id, title: col.title, taskIds: (col.tasks || []).map(t => t.id) };
        columnOrder.push(col.id);
        (col.tasks || []).forEach(task => { tasksMap[task.id] = task; });
      });
      setData({ tasks: tasksMap, columns: columnsMap, columnOrder });
    } catch (e) {
      console.error('fetch board error', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [workspaceId]);

  useEffect(() => { if (workspaceId) fetchData(); }, [workspaceId]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const createTask = (columnId) => {
    if (!data.columnOrder.length) { Alert.alert('No columns', 'Create a column first'); return; }
    setTaskModal({ visible: true, columnId: columnId || data.columnOrder[0], task: null });
  };

  const editTask = (taskId) => {
    const task = data.tasks[taskId];
    if (task) setTaskModal({ visible: true, columnId: task.columnId, task });
  };

  const deleteTask = (taskId) => {
    Alert.alert('Delete Task', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await kanbanService.deleteTask(taskId);
          setData(prev => {
            const newTasks = { ...prev.tasks };
            delete newTasks[taskId];
            const newColumns = { ...prev.columns };
            Object.keys(newColumns).forEach(cid => {
              newColumns[cid] = { ...newColumns[cid], taskIds: newColumns[cid].taskIds.filter(id => id !== taskId) };
            });
            return { ...prev, tasks: newTasks, columns: newColumns };
          });
        } catch (e) { console.error(e); }
      }},
    ]);
  };

  const moveTask = (taskId, targetColumnId) => {
    const task = data.tasks[taskId];
    if (!task || task.columnId === targetColumnId) return;
    const newOrder = (data.columns[targetColumnId]?.taskIds?.length || 0);
    setData(prev => {
      const newColumns = { ...prev.columns };
      Object.keys(newColumns).forEach(cid => {
        newColumns[cid] = { ...newColumns[cid], taskIds: newColumns[cid].taskIds.filter(id => id !== taskId) };
      });
      newColumns[targetColumnId] = { ...newColumns[targetColumnId], taskIds: [...(newColumns[targetColumnId]?.taskIds || []), taskId] };
      return { ...prev, columns: newColumns };
    });
    kanbanService.updateTask(taskId, { columnId: targetColumnId, order: newOrder }).catch(e => { fetchData(); });
  };

  const onTaskSaved = (savedTask) => {
    fetchData();
    setTaskModal({ visible: false, columnId: null, task: null });
  };

  const onColumnCreated = () => {
    fetchData();
    setColumnModal(false);
  };

  const tasksForColumn = (columnId) => {
    const column = data.columns[columnId];
    if (!column) return [];
    return column.taskIds
      .map(id => data.tasks[id])
      .filter(Boolean)
      .filter(t => {
        if (search && !t.title?.toLowerCase().includes(search.toLowerCase()) && !t.type?.toLowerCase().includes(search.toLowerCase())) return false;
        if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
        if (filterType !== 'all' && t.type !== filterType) return false;
        return true;
      });
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: palette.colors.page }}>
        <ActivityIndicator size="large" color={isDark ? '#5eead4' : '#0f766e'} />
      </View>
    );
  }

  const activeFilters = (filterPriority !== 'all' ? 1 : 0) + (filterType !== 'all' ? 1 : 0);

  return (
    <View className="flex-1" style={{ backgroundColor: palette.colors.page }}>
      <KanbanTaskModal
        visible={taskModal.visible}
        workspaceId={workspaceId}
        columnId={taskModal.columnId}
        task={taskModal.task}
        onClose={() => setTaskModal({ visible: false, columnId: null, task: null })}
        onSaved={onTaskSaved}
        columns={data.columnOrder.map(id => data.columns[id]).filter(Boolean)}
        onMoveTask={moveTask}
      />
      <AddKanbanColumnModal
        visible={columnModal}
        workspaceId={workspaceId}
        onClose={() => setColumnModal(false)}
        onCreated={onColumnCreated}
      />

      <View className="px-4 pt-1 pb-2">
        <View className="flex-row items-center gap-2">
          <View className="flex-1 flex-row items-center rounded-2xl px-3 h-10" style={{ backgroundColor: palette.colors.surfaceMuted }}>
            <Ionicons name="search" size={16} color={palette.textMutedColor} />
            <TextInput
              className="flex-1 ml-2 text-[13px]" style={{ color: palette.textColor }}
              placeholder="Search tasks..."
              placeholderTextColor={palette.textMutedColor}
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <TouchableOpacity
            onPress={() => setShowFilters(!showFilters)}
            className="h-10 w-10 items-center justify-center rounded-2xl relative"
            style={{ backgroundColor: palette.colors.surfaceMuted }}
          >
            <Ionicons name="funnel" size={16} color={activeFilters > 0 ? '#5eead4' : palette.textMutedColor} />
            {activeFilters > 0 && (
              <View className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-teal-500 items-center justify-center">
                <Text className="text-[8px] font-bold text-white">{activeFilters}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onRefresh}
            className="h-10 w-10 items-center justify-center rounded-2xl"
            style={{ backgroundColor: palette.colors.surfaceMuted }}
          >
            <Ionicons name="refresh" size={16} color={palette.textMutedColor} />
          </TouchableOpacity>
        </View>

        {showFilters && (
          <View className="flex-row gap-2 mt-2">
            <View className="flex-1">
              <Text className="text-[9px] font-bold mb-1 uppercase tracking-wider" style={{ color: palette.textMutedColor }}>Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-1.5">
                {['all', 'task', 'article', 'social', 'note'].map(t => (
                  <TouchableOpacity key={t} onPress={() => setFilterType(t)}
                    className="px-3 py-1.5 rounded-full"
                    style={{ backgroundColor: filterType === t ? (isDark ? '#334155' : '#e2e8f0') : 'transparent', borderWidth: 1, borderColor: palette.colors.border }}
                  >
                    <Text className="text-[11px] font-bold capitalize" style={{ color: filterType === t ? palette.textColor : palette.textMutedColor }}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View className="flex-1">
              <Text className="text-[9px] font-bold mb-1 uppercase tracking-wider" style={{ color: palette.textMutedColor }}>Priority</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-1.5">
                {['all', 'low', 'medium', 'high', 'urgent'].map(p => (
                  <TouchableOpacity key={p} onPress={() => setFilterPriority(p)}
                    className="px-3 py-1.5 rounded-full"
                    style={{ backgroundColor: filterPriority === p ? (isDark ? '#334155' : '#e2e8f0') : 'transparent', borderWidth: 1, borderColor: palette.colors.border }}
                  >
                    <Text className="text-[11px] font-bold capitalize" style={{ color: filterPriority === p ? palette.textColor : palette.textMutedColor }}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? '#5eead4' : '#0f766e'} />}
      >
        {data.columnOrder.map((columnId, ci) => {
          const column = data.columns[columnId];
          if (!column) return null;
          const tasks = tasksForColumn(columnId);
          return (
            <KanbanColumnView
              key={column.id}
              column={column}
              tasks={tasks}
              index={ci}
              onCreateTask={() => createTask(column.id)}
              onDeleteColumn={() => {
                if (column.taskIds.length > 0) {
                  Alert.alert('Delete Column', `"${column.title}" has ${column.taskIds.length} tasks. Delete anyway?`, [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: async () => {
                      try {
                        await kanbanService.deleteColumn(column.id);
                        setData(prev => {
                          const newColumns = { ...prev.columns };
                          delete newColumns[column.id];
                          return { ...prev, columns: newColumns, columnOrder: prev.columnOrder.filter(id => id !== column.id) };
                        });
                      } catch (e) { console.error(e); }
                    }},
                  ]);
                } else {
                  kanbanService.deleteColumn(column.id).then(() => {
                    setData(prev => {
                      const newColumns = { ...prev.columns };
                      delete newColumns[column.id];
                      return { ...prev, columns: newColumns, columnOrder: prev.columnOrder.filter(id => id !== column.id) };
                    });
                  }).catch(e => console.error(e));
                }
              }}
              onEditTask={editTask}
              onDeleteTask={deleteTask}
              onMoveTask={moveTask}
              palette={palette}
              isDark={isDark}
              columnIds={data.columnOrder}
            />
          );
        })}

        <TouchableOpacity
          onPress={() => setColumnModal(true)}
          className="w-72 rounded-2xl border-2 border-dashed items-center justify-center mr-4"
          style={{ borderColor: palette.colors.border + '80', minHeight: 160, marginTop: 48 }}
        >
          <View className="p-3 rounded-full" style={{ backgroundColor: palette.colors.surfaceMuted }}>
            <Ionicons name="add" size={24} color={palette.textMutedColor} />
          </View>
          <Text className="mt-3 text-[12px] font-bold" style={{ color: palette.textMutedColor }}>Add Column</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function KanbanColumnView({ column, tasks, onCreateTask, onDeleteColumn, onEditTask, onDeleteTask, onMoveTask, palette, isDark, columnIds }) {
  return (
    <View className="w-72 rounded-2xl mr-3 overflow-hidden" style={{ backgroundColor: isDark ? 'rgba(30,41,59,0.6)' : 'rgba(255,255,255,0.85)', borderWidth: 1, borderColor: palette.colors.border + '60', maxHeight: '100%' }}>
      <View className="px-4 py-3.5 flex-row items-center justify-between" style={{ borderBottomWidth: 1, borderBottomColor: palette.colors.border + '40' }}>
        <View className="flex-row items-center gap-2.5">
          <View className="h-7 w-7 rounded-lg items-center justify-center" style={{ backgroundColor: isDark ? 'rgba(20,184,166,0.15)' : 'rgba(20,184,166,0.1)' }}>
            <Text className="text-[10px] font-bold text-teal-600">{tasks.length}</Text>
          </View>
          <Text className="text-[13px] font-bold" style={{ color: palette.textColor }}>{column.title}</Text>
        </View>
        <View className="flex-row gap-1">
          <TouchableOpacity onPress={onCreateTask} className="p-1.5 rounded-lg" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}>
            <Ionicons name="add" size={14} color={palette.textMutedColor} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onDeleteColumn} className="p-1.5 rounded-lg" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}>
            <Ionicons name="ellipsis-horizontal" size={14} color={palette.textMutedColor} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 10, paddingBottom: 4 }} style={{ maxHeight: 500 }}>
        {tasks.length === 0 ? (
          <View className="items-center py-8">
            <Text className="text-[11px]" style={{ color: palette.textMutedColor }}>No tasks</Text>
          </View>
        ) : (
          tasks.map(task => (
            <KanbanCardView
              key={task.id}
              task={task}
              onEdit={() => onEditTask(task.id)}
              onDelete={() => onDeleteTask(task.id)}
              onMove={(colId) => onMoveTask(task.id, colId)}
              palette={palette}
              isDark={isDark}
              columnIds={columnIds}
            />
          ))
        )}
      </ScrollView>

      <TouchableOpacity
        onPress={onCreateTask}
        className="mx-3 my-3 py-2.5 rounded-xl flex-row items-center justify-center gap-1.5"
        style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderWidth: 1, borderColor: palette.colors.border + '30' }}
      >
        <Ionicons name="add" size={14} color={palette.textMutedColor} />
        <Text className="text-[11px] font-bold" style={{ color: palette.textMutedColor }}>Add Task</Text>
      </TouchableOpacity>
    </View>
  );
}

function KanbanCardView({ task, onEdit, onDelete, onMove, palette, isDark, columnIds }) {
  const [showActions, setShowActions] = useState(false);
  const doneChecklists = (task.checklists || []).filter(c => c.completed).length;
  const totalChecklists = (task.checklists || []).length;

  return (
    <Pressable
      onPress={onEdit}
      className="mb-2.5 rounded-xl p-3.5 overflow-hidden"
      style={{ backgroundColor: isDark ? 'rgba(15,23,42,0.7)' : '#ffffff', borderWidth: 1, borderColor: palette.colors.border + '50' }}
    >
      <View className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ backgroundColor: priorityColors[task.priority] || priorityColors.medium, opacity: 0.5 }} />

      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-row items-center gap-1.5">
          <View className="p-1 rounded-md" style={{ backgroundColor: (typeColors[task.type] || '#6366f1') + '20' }}>
            <Ionicons name={typeIcons[task.type] || 'checkbox-outline'} size={12} color={typeColors[task.type] || '#6366f1'} />
          </View>
          <Text className="text-[9px] font-bold uppercase tracking-wider" style={{ color: palette.textMutedColor }}>{task.type}</Text>
        </View>
        <TouchableOpacity onPress={() => setShowActions(!showActions)}>
          <Ionicons name="ellipsis-horizontal" size={16} color={palette.textMutedColor} />
        </TouchableOpacity>
      </View>

      <Text className="text-[13px] font-bold leading-tight mb-1" style={{ color: palette.textColor }} numberOfLines={2}>{task.title}</Text>
      {task.content ? <Text className="text-[10px] leading-relaxed mb-2" style={{ color: palette.textMutedColor }} numberOfLines={1}>{task.content}</Text> : null}

      {totalChecklists > 0 && (
        <View className="mb-2">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-[8px] font-bold uppercase tracking-wider" style={{ color: palette.textMutedColor + '99' }}>Checklist</Text>
            <Text className="text-[9px] font-bold" style={{ color: palette.textMutedColor }}>{doneChecklists}/{totalChecklists}</Text>
          </View>
          <View className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}>
            <View className="h-full rounded-full" style={{ width: `${(doneChecklists / totalChecklists) * 100}%`, backgroundColor: '#14b8a6' }} />
          </View>
        </View>
      )}

      <View className="flex-row items-center justify-between mt-1.5 pt-2" style={{ borderTopWidth: 1, borderTopColor: palette.colors.border + '30' }}>
        <View className="flex-row items-center gap-2">
          <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: (priorityColors[task.priority] || '#3b82f6') + '15' }}>
            <Text className="text-[8px] font-bold capitalize" style={{ color: priorityColors[task.priority] || '#3b82f6' }}>{task.priority}</Text>
          </View>
          {task.dueDate && (
            <View className="flex-row items-center gap-1 px-1.5 py-0.5 rounded-md" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}>
              <Ionicons name="time-outline" size={10} color={palette.textMutedColor} />
              <Text className="text-[9px]" style={{ color: palette.textMutedColor }}>{new Date(task.dueDate).toLocaleDateString()}</Text>
            </View>
          )}
        </View>
        {task.assignee && (
          <View className="h-6 w-6 rounded-full items-center justify-center" style={{ backgroundColor: isDark ? 'rgba(20,184,166,0.2)' : 'rgba(20,184,166,0.15)' }}>
            <Text className="text-[8px] font-bold text-teal-600">{task.assignee.displayName?.[0] || 'U'}</Text>
          </View>
        )}
      </View>

      {showActions && (
        <View className="mt-2 pt-2 flex-row flex-wrap gap-1.5" style={{ borderTopWidth: 1, borderTopColor: palette.colors.border + '30' }}>
          <TouchableOpacity onPress={onEdit} className="px-2.5 py-1.5 rounded-lg flex-row items-center gap-1" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}>
            <Ionicons name="create-outline" size={12} color={palette.textMutedColor} />
            <Text className="text-[10px] font-bold" style={{ color: palette.textMutedColor }}>Edit</Text>
          </TouchableOpacity>
          {columnIds.map(colId => colId !== task.columnId ? (
            <TouchableOpacity key={colId} onPress={() => { onMove(colId); setShowActions(false); }} className="px-2.5 py-1.5 rounded-lg flex-row items-center gap-1" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}>
              <Ionicons name="arrow-forward" size={12} color={palette.textMutedColor} />
              <Text className="text-[10px] font-bold" style={{ color: palette.textMutedColor }} numberOfLines={1}>{columnIds.findIndex(id => id === colId) !== -1 ? 'Move' : ''}</Text>
            </TouchableOpacity>
          ) : null)}
          <TouchableOpacity onPress={onDelete} className="px-2.5 py-1.5 rounded-lg flex-row items-center gap-1" style={{ backgroundColor: 'rgba(225,29,72,0.1)' }}>
            <Ionicons name="trash-outline" size={12} color="#e11d48" />
            <Text className="text-[10px] font-bold" style={{ color: '#e11d48' }}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </Pressable>
  );
}
