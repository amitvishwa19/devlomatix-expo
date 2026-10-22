import React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useCrmTheme } from '~/utils/crm/colors';

const KANBAN_COLUMNS = [
  { id: 'PENDING', title: 'To Do', icon: 'time-outline', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  { id: 'IN_PROGRESS', title: 'In Progress', icon: 'play-outline', color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
  { id: 'REVIEW', title: 'Follow-up', icon: 'eye-outline', color: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd' },
  { id: 'COMPLETED', title: 'Done', icon: 'checkmark-circle-outline', color: '#10b981', bg: '#ecfdf5', border: '#a7f3d0' },
];

export default function KanbanColumnView({ tasks = [], onUpdateStatus, onOpenTask, onAddTask }) {
  const { colors, isDark } = useCrmTheme();

  const getTasksForColumn = (colId) => {
    return tasks.filter((t) => {
      if (!t) return false;
      const status = (t.status || 'PENDING').toUpperCase();
      if (colId === 'PENDING') return status === 'PENDING' || status === 'TODO';
      if (colId === 'IN_PROGRESS') return status === 'IN_PROGRESS' || status === 'PROGRESS';
      if (colId === 'REVIEW') return status === 'REVIEW' || status === 'FOLLOWUP';
      if (colId === 'COMPLETED') return status === 'COMPLETED' || status === 'DONE';
      return false;
    });
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 120 }}
      className="flex-1 pt-2"
    >
      {KANBAN_COLUMNS.map((col) => {
        const colTasks = getTasksForColumn(col.id);

        return (
          <View
            key={col.id}
            className="w-72 mr-3 rounded-[18px] border flex-col"
            style={{
              backgroundColor: isDark ? '#0f172a' : '#f8fafc',
              borderColor: colors.border,
              maxHeight: '100%',
            }}
          >
            {/* Column Header */}
            <View
              className="flex-row items-center justify-between p-3 border-b"
              style={{
                borderColor: colors.border,
                borderTopLeftRadius: 18,
                borderTopRightRadius: 18,
                backgroundColor: colors.card,
              }}
            >
              <View className="flex-row items-center gap-x-2">
                <View
                  className="h-6 w-6 rounded-lg items-center justify-center border"
                  style={{
                    backgroundColor: col.bg,
                    borderColor: col.border,
                  }}
                >
                  <Ionicons name={col.icon} size={13} color={col.color} />
                </View>
                <Text className="text-xs font-bold tracking-tight" style={{ color: colors.text }}>
                  {col.title}
                </Text>
              </View>

              <View
                className="rounded-full px-2 py-0.5 border"
                style={{
                  backgroundColor: col.bg,
                  borderColor: col.border,
                }}
              >
                <Text className="text-[10px] font-bold" style={{ color: col.color }}>
                  {colTasks.length}
                </Text>
              </View>
            </View>

            {/* Column Tasks Scroll */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: 10, paddingBottom: 20 }}
              className="flex-1"
            >
              {colTasks.length === 0 ? (
                <View className="items-center justify-center py-12 px-4 border border-dashed rounded-xl" style={{ borderColor: colors.borderLight }}>
                  <Text className="text-[11px] font-semibold text-slate-400 text-center">
                    No tasks in {col.title}
                  </Text>
                </View>
              ) : (
                colTasks.map((task) => {
                  const priorityStyle = colors.priority[task.priority] || colors.priority.MEDIUM;
                  const checklists = Array.isArray(task.checklists) ? task.checklists : [];
                  const completedChecks = checklists.filter((c) => c.isCompleted || c.completed).length;

                  return (
                    <Pressable
                      key={task.id}
                      onPress={() => onOpenTask && onOpenTask(task)}
                      className="mb-2.5 rounded-xl border p-2.5 shadow-xs active:opacity-80"
                      style={{
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      }}
                    >
                      {/* Priority Tag */}
                      <View className="flex-row items-center justify-between mb-1.5">
                        <View
                          className="flex-row items-center gap-x-1 rounded-md px-1.5 py-0.2 border"
                          style={{
                            backgroundColor: priorityStyle.bg,
                            borderColor: priorityStyle.border,
                          }}
                        >
                          <View className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: priorityStyle.dot }} />
                          <Text className="text-[8px] font-bold tracking-wider" style={{ color: priorityStyle.text }}>
                            {task.priority || 'MEDIUM'}
                          </Text>
                        </View>

                        {task.type && (
                          <Text className="text-[9px] font-mono font-bold" style={{ color: colors.textMuted }}>
                            {task.type}
                          </Text>
                        )}
                      </View>

                      {/* Task Title */}
                      <Text
                        className="text-xs font-bold leading-tight"
                        style={{ color: colors.text }}
                        numberOfLines={2}
                      >
                        {task.title}
                      </Text>

                      {/* Associated Contact / Deal */}
                      {(task.contact || task.deal) && (
                        <Text className="text-[10px] font-medium mt-1" style={{ color: colors.primaryLight }} numberOfLines={1}>
                          • {task.contact?.name || task.deal?.title}
                        </Text>
                      )}

                      {/* Checklist Progress if available */}
                      {checklists.length > 0 && (
                        <View className="mt-2 flex-row items-center gap-x-1.5">
                          <Ionicons name="checkbox-outline" size={11} color={colors.textMuted} />
                          <Text className="text-[9px] font-semibold" style={{ color: colors.textMuted }}>
                            {completedChecks}/{checklists.length} subtasks
                          </Text>
                        </View>
                      )}

                      {/* Column Move Actions */}
                      <View className="mt-2 flex-row items-center justify-end gap-x-1 border-t pt-1.5" style={{ borderColor: colors.borderLight }}>
                        {col.id !== 'IN_PROGRESS' && col.id !== 'COMPLETED' && (
                          <Pressable
                            onPress={() => onUpdateStatus && onUpdateStatus(task.id, 'IN_PROGRESS')}
                            className="px-2 py-0.5 rounded-md border"
                            style={{ backgroundColor: colors.cardAlt, borderColor: colors.border }}
                          >
                            <Text className="text-[9px] font-bold" style={{ color: colors.text }}>
                              → Progress
                            </Text>
                          </Pressable>
                        )}

                        {col.id !== 'COMPLETED' && (
                          <Pressable
                            onPress={() => onUpdateStatus && onUpdateStatus(task.id, 'COMPLETED')}
                            className="px-2 py-0.5 rounded-md border"
                            style={{ backgroundColor: colors.successSoft, borderColor: colors.successBorder }}
                          >
                            <Text className="text-[9px] font-bold" style={{ color: colors.success }}>
                              ✓ Done
                            </Text>
                          </Pressable>
                        )}
                      </View>
                    </Pressable>
                  );
                })
              )}

              {/* Add Task to Column Button */}
              {onAddTask && (
                <Pressable
                  onPress={() => onAddTask(col.id)}
                  className="mt-1 flex-row items-center justify-center gap-x-1 p-2 rounded-xl border border-dashed active:opacity-75"
                  style={{ borderColor: colors.border }}
                >
                  <Ionicons name="add" size={14} color={colors.textMuted} />
                  <Text className="text-[11px] font-bold" style={{ color: colors.textMuted }}>
                    Add Task
                  </Text>
                </Pressable>
              )}
            </ScrollView>
          </View>
        );
      })}
    </ScrollView>
  );
}
