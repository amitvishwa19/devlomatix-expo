import React, { useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, Text, View, ActivityIndicator } from 'react-native';
import AppScreen from '~/components/AppScreen';
import { useCrm } from '~/providers/CrmProvider';
import CrmHeader from '../_components/CrmHeader';
import TaskCard from '../_components/TaskCard';
import QuickWhatsAppModal from '../_components/QuickWhatsAppModal';
import CreateTaskModal from '../_components/CreateTaskModal';

export default function CrmTasksTab() {
  const router = useRouter();
  const { tasks = [], loading, refreshing, refreshAll, openCreateTask } = useCrm();

  const [activeTab, setActiveTab] = useState('PENDING'); // 'PENDING' | 'COMPLETED'
  const [selectedType, setSelectedType] = useState('ALL');

  const taskList = Array.isArray(tasks) ? tasks : [];
  const pendingTasks = taskList.filter((t) => t && t.status !== 'COMPLETED');
  const completedTasks = taskList.filter((t) => t && t.status === 'COMPLETED');

  const currentList = activeTab === 'PENDING' ? pendingTasks : completedTasks;

  const filteredTasks = currentList.filter((t) => {
    if (!t) return false;
    if (selectedType !== 'ALL' && t.type !== selectedType) return false;
    return true;
  });

  return (
    <AppScreen>
      <CrmHeader
        title="Tasks & Follow-ups"
        subtitle={`${pendingTasks.length} Pending Actions`}
        rightActions={
          <Pressable
            onPress={() => openCreateTask()}
            className="h-9 px-3 flex-row items-center justify-center gap-x-1 rounded-xl bg-indigo-600 active:bg-indigo-700"
          >
            <Ionicons name="add" size={16} color="#ffffff" />
            <Text className="text-xs font-bold text-white">Task</Text>
          </Pressable>
        }
      />

      <QuickWhatsAppModal />
      <CreateTaskModal />

      {/* Tabs & Type Filters Bar */}
      <View className="bg-white px-4 py-2.5 border-b border-slate-200">
        {/* Status Switcher */}
        <View className="flex-row rounded-xl border border-slate-200 bg-slate-100 p-1 mb-2.5">
          <Pressable
            onPress={() => setActiveTab('PENDING')}
            className={`flex-1 items-center justify-center rounded-lg py-2 ${
              activeTab === 'PENDING' ? 'bg-white shadow-sm' : 'bg-transparent'
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                activeTab === 'PENDING' ? 'text-indigo-700' : 'text-slate-600'
              }`}
            >
              Pending ({pendingTasks.length})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('COMPLETED')}
            className={`flex-1 items-center justify-center rounded-lg py-2 ${
              activeTab === 'COMPLETED' ? 'bg-white shadow-sm' : 'bg-transparent'
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                activeTab === 'COMPLETED' ? 'text-indigo-700' : 'text-slate-600'
              }`}
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
          {['ALL', 'CALL', 'WHATSAPP', 'MEETING', 'EMAIL', 'REVIEW'].map((t) => {
            const isSelected = selectedType === t;
            return (
              <Pressable
                key={t}
                onPress={() => setSelectedType(t)}
                className={`mr-2 rounded-xl px-3 py-1.5 border ${
                  isSelected
                    ? 'bg-slate-900 border-slate-900'
                    : 'bg-slate-50 border-slate-200 active:bg-slate-100'
                }`}
              >
                <Text
                  className={`text-[11px] font-bold ${
                    isSelected ? 'text-white' : 'text-slate-700'
                  }`}
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
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 130 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshAll} />}
        className="px-4 pt-3.5"
      >
        {loading && tasks.length === 0 ? (
          <View className="py-14 items-center justify-center">
            <ActivityIndicator size="large" color="#4f46e5" />
            <Text className="text-xs text-slate-400 font-semibold mt-2">Loading follow-ups...</Text>
          </View>
        ) : filteredTasks.length > 0 ? (
          filteredTasks.map((task) => <TaskCard key={task.id} task={task} />)
        ) : (
          <View className="rounded-2xl border border-dashed border-slate-300 p-8 items-center justify-center bg-white">
            <Ionicons name="checkmark-done-circle-outline" size={36} color="#059669" />
            <Text className="text-sm font-bold text-slate-700 mt-2">
              {activeTab === 'PENDING' ? 'All Follow-ups Completed!' : 'No Completed Tasks'}
            </Text>
            <Text className="text-xs text-slate-400 text-center mt-1">
              {activeTab === 'PENDING'
                ? 'Great job! Schedule a new follow-up to keep deals moving.'
                : 'Tasks you complete will be archived here for audit history.'}
            </Text>
            <Pressable
              onPress={() => openCreateTask()}
              className="mt-3.5 rounded-xl bg-indigo-600 px-4 py-2"
            >
              <Text className="text-xs font-bold text-white">+ Schedule New Follow-up</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </AppScreen>
  );
}
