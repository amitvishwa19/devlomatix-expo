import React, { useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useCrm } from '~/providers/CrmProvider';
import * as crmService from '~/services/crm';

const TASK_TYPE_ICONS = {
  CALL: { icon: 'call-outline', color: '#0284c7', bg: 'bg-sky-50 border-sky-200' },
  WHATSAPP: { icon: 'logo-whatsapp', color: '#059669', bg: 'bg-emerald-50 border-emerald-200' },
  MEETING: { icon: 'people-outline', color: '#7c3aed', bg: 'bg-purple-50 border-purple-200' },
  EMAIL: { icon: 'mail-outline', color: '#ea580c', bg: 'bg-orange-50 border-orange-200' },
  REVIEW: { icon: 'document-text-outline', color: '#4f46e5', bg: 'bg-indigo-50 border-indigo-200' },
};

export default function TaskCard({ task, onStatusChange }) {
  const router = useRouter();
  const { openQuickWhatsApp, loadTasks } = useCrm();
  const [isCompleted, setIsCompleted] = useState(task?.status === 'COMPLETED');
  const [updating, setUpdating] = useState(false);

  if (!task) return null;

  const typeConfig = TASK_TYPE_ICONS[task.type] || TASK_TYPE_ICONS.CALL;

  const toggleComplete = async () => {
    try {
      setUpdating(true);
      const nextStatus = isCompleted ? 'PENDING' : 'COMPLETED';
      setIsCompleted(!isCompleted);
      await crmService.updateTask(task.id, { status: nextStatus });
      if (onStatusChange) onStatusChange(task.id, nextStatus);
      loadTasks();
    } catch (e) {
      setIsCompleted(isCompleted);
      console.warn('Failed to toggle task status:', e.message);
    } finally {
      setUpdating(false);
    }
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !isCompleted;
  const dueDateFormatted = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
    : 'No due date';

  return (
    <View
      className={`mb-2.5 rounded-2xl border bg-white p-3.5 shadow-sm ${
        isCompleted
          ? 'border-slate-100 bg-slate-50/70 opacity-60'
          : isOverdue
          ? 'border-rose-200/90'
          : 'border-slate-200/90'
      }`}
    >
      <View className="flex-row items-start justify-between gap-x-2">
        {/* Checkbox & Details */}
        <View className="flex-row items-start gap-x-3 flex-1">
          <Pressable
            onPress={toggleComplete}
            disabled={updating}
            className={`mt-0.5 h-6 w-6 items-center justify-center rounded-lg border ${
              isCompleted
                ? 'bg-indigo-600 border-indigo-600'
                : 'border-slate-300 bg-white active:bg-slate-100'
            }`}
          >
            {isCompleted && <Ionicons name="checkmark" size={14} color="#ffffff" />}
          </Pressable>

          <View className="flex-1">
            <Text
              className={`text-sm font-bold tracking-tight ${
                isCompleted ? 'line-through text-slate-400' : 'text-slate-900'
              }`}
            >
              {task.title}
            </Text>

            {/* Sub-meta: Linked Deal / Contact */}
            {(task.deal || task.contact) && (
              <View className="mt-1 flex-row items-center gap-x-1.5 flex-wrap">
                {task.deal && (
                  <Pressable
                    onPress={() => router.push(`/(modules)/crm/deals/${task.deal.id}`)}
                    className="flex-row items-center gap-x-1 rounded-md bg-indigo-50 px-1.5 py-0.5 border border-indigo-100"
                  >
                    <Ionicons name="briefcase-outline" size={10} color="#4f46e5" />
                    <Text className="text-[10px] font-bold text-indigo-700" numberOfLines={1}>
                      {task.deal.title}
                    </Text>
                  </Pressable>
                )}

                {task.contact && (
                  <Pressable
                    onPress={() => router.push(`/(modules)/crm/contacts/${task.contact.id}`)}
                    className="flex-row items-center gap-x-1 rounded-md bg-slate-100 px-1.5 py-0.5 border border-slate-200"
                  >
                    <Ionicons name="person-outline" size={10} color="#475569" />
                    <Text className="text-[10px] font-medium text-slate-700" numberOfLines={1}>
                      {task.contact.name}
                    </Text>
                  </Pressable>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Type Icon Badge */}
        <View className={`rounded-xl border px-2 py-1 flex-row items-center gap-x-1 ${typeConfig.bg}`}>
          <Ionicons name={typeConfig.icon} size={12} color={typeConfig.color} />
          <Text className="text-[9px] font-bold" style={{ color: typeConfig.color }}>
            {task.type || 'CALL'}
          </Text>
        </View>
      </View>

      {/* Footer Info: Due Date & Action */}
      <View className="mt-2.5 flex-row items-center justify-between border-t border-slate-100 pt-2">
        <View className="flex-row items-center gap-x-1">
          <Ionicons
            name={isOverdue ? 'alert-circle' : 'calendar-outline'}
            size={12}
            color={isOverdue ? '#e11d48' : '#94a3b8'}
          />
          <Text
            className={`text-[10px] font-semibold ${
              isOverdue ? 'text-rose-600 font-bold' : 'text-slate-500'
            }`}
          >
            {isOverdue ? `Overdue (${dueDateFormatted})` : `Due: ${dueDateFormatted}`}
          </Text>
        </View>

        {task.contact?.phone && (
          <Pressable
            onPress={() => openQuickWhatsApp(task.contact, task.deal, `Hi ${task.contact.name}, regarding ${task.title}...`)}
            className="flex-row items-center gap-x-1 rounded-lg bg-emerald-50 px-2 py-1 border border-emerald-200"
          >
            <Ionicons name="logo-whatsapp" size={11} color="#059669" />
            <Text className="text-[9px] font-bold text-emerald-700">Quick Follow-up</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
