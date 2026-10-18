import React, { useRef, useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useScrollToTop } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, Text, View, ActivityIndicator } from 'react-native';
import AppScreen from '~/components/AppScreen';
import { useCrm } from '~/providers/CrmProvider';
import { useCrmTheme } from '../utils/colors';
import { CRM_TASK_TYPES } from '../utils/constants';
import CrmHeader from '../_components/CrmHeader';
import TaskCard from '../_components/TaskCard';
import QuickWhatsAppModal from '../_components/QuickWhatsAppModal';
import CreateTaskModal from '../_components/CreateTaskModal';
import KanbanColumnView from '../_components/KanbanColumnView';
import * as crmService from '~/services/crm';

export default function CrmTasksScreen() {
  const router = useRouter();
  const { colors } = useCrmTheme();
  const scrollRef = useRef(null);
  useScrollToTop(scrollRef);
  const { tasks = [], loading, refreshing, refreshAll, openCreateTask } = useCrm();

  const [viewMode, setViewMode] = useState('LIST'); // 'LIST' | 'KANBAN'
  const [activeTab, setActiveTab] = useState('PENDING'); // 'PENDING' | 'COMPLETED'
  const [selectedType, setSelectedType] = useState('ALL');

  const taskList = Array.isArray(tasks) ? tasks : [];
  const pendingTasks = taskList.filter((t) => t && t.status !== 'COMPLETED');
  const completedTasks = taskList.filter((t) => t && t.status === 'COMPLETED');

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      await crmService.updateTask(taskId, { status: newStatus });
      refreshAll();
    } catch (e) {
      console.warn('Failed to update task status:', e?.message || e);
    }
  };

  const currentList = activeTab === 'PENDING' ? pendingTasks : completedTasks;

  const filteredTasks = currentList.filter((t) => {
    if (!t) return false;
    if (selectedType !== 'ALL' && t.type !== selectedType) return false;
    return true;
  });

  return (
    <AppScreen>
      <CrmHeader
        title="Tasks & Kanban"
        subtitle={`${pendingTasks.length} Pending Actions • ${viewMode === 'KANBAN' ? 'Board View' : 'List View'}`}
        showBack={true}
        rightActions={
          <View className="flex-row items-center gap-x-1.5">
            <Pressable
              onPress={() => setViewMode((prev) => (prev === 'LIST' ? 'KANBAN' : 'LIST'))}
              className="h-9 px-2.5 flex-row items-center justify-center gap-x-1 rounded-xl border active:opacity-75"
              style={{
                backgroundColor: viewMode === 'KANBAN' ? colors.primarySoft : colors.cardAlt,
                borderColor: viewMode === 'KANBAN' ? colors.primaryBorder : colors.border,
              }}
            >
              <Ionicons
                name={viewMode === 'KANBAN' ? 'list' : 'grid-outline'}
                size={14}
                color={viewMode === 'KANBAN' ? colors.primary : colors.text}
              />
              <Text
                className="text-[11px] font-bold"
                style={{ color: viewMode === 'KANBAN' ? colors.primary : colors.text }}
              >
                {viewMode === 'KANBAN' ? 'List' : 'Board'}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => openCreateTask()}
              className="h-9 px-3 flex-row items-center justify-center gap-x-1 rounded-xl active:opacity-80"
              style={{ backgroundColor: colors.primary }}
            >
              <Ionicons name="add" size={16} color="#ffffff" />
              <Text className="text-xs font-bold text-white">Task</Text>
            </Pressable>
          </View>
        }
      />

      <QuickWhatsAppModal />
      <CreateTaskModal />

      {viewMode === 'KANBAN' ? (
        <KanbanColumnView
          tasks={taskList}
          onUpdateStatus={handleUpdateTaskStatus}
          onAddTask={() => openCreateTask()}
        />
      ) : (
        <>
          {/* Tabs & Type Filters Bar */}
          <View
            className="px-3 py-2 border-b"
            style={{
              backgroundColor: colors.header,
              borderColor: colors.border,
            }}
          >
            {/* Status Switcher */}
            <View
              className="flex-row rounded-xl border p-1 mb-2"
              style={{
                backgroundColor: colors.cardAlt,
                borderColor: colors.border,
              }}
            >
              <Pressable
                onPress={() => setActiveTab('PENDING')}
                className="flex-1 items-center justify-center rounded-lg py-1.5"
                style={{
                  backgroundColor: activeTab === 'PENDING' ? colors.primary : 'transparent',
                }}
              >
                <Text
                  className="text-xs font-bold"
                  style={{
                    color: activeTab === 'PENDING' ? '#ffffff' : colors.textMuted,
                  }}
                >
                  Pending ({pendingTasks.length})
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setActiveTab('COMPLETED')}
                className="flex-1 items-center justify-center rounded-lg py-1.5"
                style={{
                  backgroundColor: activeTab === 'COMPLETED' ? colors.primary : 'transparent',
                }}
              >
                <Text
                  className="text-xs font-bold"
                  style={{
                    color: activeTab === 'COMPLETED' ? '#ffffff' : colors.textMuted,
                  }}
                >
                  Completed ({completedTasks.length})
                </Text>
              </Pressable>
            </View>

            {/* Type Filters */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 20 }}
              className="flex-row py-0.5"
            >
              {CRM_TASK_TYPES.map((t) => {
                const isSelected = selectedType === t;
                return (
                  <Pressable
                    key={t}
                    onPress={() => setSelectedType(t)}
                    className="mr-2 rounded-xl px-3 py-1.5 border"
                    style={{
                      backgroundColor: isSelected ? colors.primary : colors.cardAlt,
                      borderColor: isSelected ? colors.primary : colors.border,
                    }}
                  >
                    <Text
                      className="text-[11px] font-bold"
                      style={{
                        color: isSelected ? '#ffffff' : colors.text,
                      }}
                    >
                      {t}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Task List */}
          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 130 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshAll} tintColor={colors.primary} />}
            className="px-3 pt-3"
          >
            {loading && tasks.length === 0 ? (
              <View className="py-14 items-center justify-center">
                <ActivityIndicator size="large" color={colors.primary} />
                <Text className="text-xs font-semibold mt-2" style={{ color: colors.textMuted }}>
                  Loading follow-ups...
                </Text>
              </View>
            ) : filteredTasks.length > 0 ? (
              filteredTasks.map((task) => <TaskCard key={task.id} task={task} />)
            ) : (
              <View
                className="rounded-[16px] border border-dashed p-6 items-center justify-center"
                style={{
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                }}
              >
                <Ionicons name="checkmark-done-circle-outline" size={36} color={colors.success} />
                <Text className="text-sm font-bold mt-2" style={{ color: colors.text }}>
                  {activeTab === 'PENDING' ? 'All Follow-ups Completed!' : 'No Completed Tasks'}
                </Text>
                <Text className="text-xs text-center mt-1" style={{ color: colors.textMuted }}>
                  {activeTab === 'PENDING'
                    ? 'Great job! Schedule a new follow-up to keep deals moving.'
                    : 'Tasks you complete will be archived here for audit history.'}
                </Text>
                <Pressable
                  onPress={() => openCreateTask()}
                  className="mt-3 rounded-xl px-4 py-2"
                  style={{ backgroundColor: colors.primary }}
                >
                  <Text className="text-xs font-bold text-white">+ Schedule New Follow-up</Text>
                </Pressable>
              </View>
            )}
          </ScrollView>
        </>
      )}
    </AppScreen>
  );
}
