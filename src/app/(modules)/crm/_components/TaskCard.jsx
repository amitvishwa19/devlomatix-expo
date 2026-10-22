import React, { useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useCrm } from '~/providers/CrmProvider';
import { useCrmTheme } from '../utils/colors';
import * as crmService from '~/services/crm';

const TASK_TYPE_ICONS = {
  CALL: 'call-outline',
  WHATSAPP: 'logo-whatsapp',
  MEETING: 'people-outline',
  EMAIL: 'mail-outline',
  REVIEW: 'document-text-outline',
};

export default function TaskCard({ task, onStatusChange, onDeletePrompt }) {
  const router = useRouter();
  const { colors } = useCrmTheme();
  const { openQuickWhatsApp } = useCrm();

  if (!task) return null;

  const isCompleted = task.status === 'COMPLETED';
  const typeConfig = colors.taskType[task.type] || colors.taskType.CALL;
  const typeIcon = TASK_TYPE_ICONS[task.type] || 'calendar-outline';

  const toggleComplete = () => {
    const nextStatus = isCompleted ? 'PENDING' : 'COMPLETED';
    if (onStatusChange) {
      onStatusChange(task.id, nextStatus);
    }
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !isCompleted;
  const dueDateFormatted = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
    : 'No due date';

  return (
    <View
      className="mb-2 rounded-[16px] border p-3 active:opacity-90"
      style={{
        backgroundColor: colors.card,
        borderColor: isOverdue ? colors.danger : colors.border,
        opacity: isCompleted ? 0.65 : 1,
        shadowColor: colors.shadowColor,
        shadowOpacity: colors.shadowOpacity,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 5,
        elevation: 2,
      }}
    >
      <View className="flex-row items-start justify-between gap-x-2">
        {/* Checkbox & Details */}
        <View className="flex-row items-start gap-x-2.5 flex-1">
          <Pressable
            onPress={toggleComplete}
            className="mt-0.5 h-5 w-5 items-center justify-center rounded-lg border active:opacity-75"
            style={{
              backgroundColor: isCompleted ? colors.primary : colors.cardAlt,
              borderColor: isCompleted ? colors.primary : colors.border,
            }}
          >
            {isCompleted && <Ionicons name="checkmark" size={13} color="#ffffff" />}
          </Pressable>

          <View className="flex-1">
            <Text
              className="text-xs font-bold tracking-tight"
              style={{
                color: isCompleted ? colors.textMuted : colors.text,
                textDecorationLine: isCompleted ? 'line-through' : 'none',
              }}
            >
              {task.title}
            </Text>

            {/* Sub-meta: Linked Deal / Contact */}
            {(task.deal || task.contact) && (
              <View className="mt-1 flex-row items-center gap-x-1.5 flex-wrap">
                {task.deal && (
                  <Pressable
                    onPress={() => router.push(`/(modules)/crm/deals/${task.deal.id}`)}
                    className="flex-row items-center gap-x-1 rounded-md px-1.5 py-0.5 border"
                    style={{
                      backgroundColor: colors.primarySoft,
                      borderColor: colors.primaryBorder,
                    }}
                  >
                    <Ionicons name="briefcase-outline" size={10} color={colors.primary} />
                    <Text className="text-[10px] font-bold" style={{ color: colors.primary }} numberOfLines={1}>
                      {task.deal.title}
                    </Text>
                  </Pressable>
                )}

                {task.contact && (
                  <Pressable
                    onPress={() => router.push(`/(modules)/crm/contacts/${task.contact.id}`)}
                    className="flex-row items-center gap-x-1 rounded-md px-1.5 py-0.5 border"
                    style={{
                      backgroundColor: colors.cardAlt,
                      borderColor: colors.border,
                    }}
                  >
                    <Ionicons name="person-outline" size={10} color={colors.textSoft} />
                    <Text className="text-[10px] font-medium" style={{ color: colors.textMuted }} numberOfLines={1}>
                      {task.contact.name}
                    </Text>
                  </Pressable>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Type Icon Badge */}
        <View
          className="rounded-xl border px-2 py-0.5 flex-row items-center gap-x-1"
          style={{
            backgroundColor: typeConfig.bg,
            borderColor: typeConfig.border,
          }}
        >
          <Ionicons name={typeIcon} size={11} color={typeConfig.color} />
          <Text className="text-[9px] font-bold" style={{ color: typeConfig.color }}>
            {task.type || 'CALL'}
          </Text>
        </View>
      </View>

      {/* Footer Info: Due Date & Action */}
      <View
        className="mt-2 flex-row items-center justify-between border-t pt-2"
        style={{ borderColor: colors.border }}
      >
        <View className="flex-row items-center gap-x-1">
          <Ionicons
            name={isOverdue ? 'alert-circle' : 'calendar-outline'}
            size={12}
            color={isOverdue ? colors.danger : colors.textSoft}
          />
          <Text
            className="text-[10px] font-semibold"
            style={{ color: isOverdue ? colors.danger : colors.textMuted }}
          >
            {isOverdue ? `Overdue (${dueDateFormatted})` : `Due: ${dueDateFormatted}`}
          </Text>
        </View>

        <View className="flex-row items-center gap-x-1.5">
          {task.contact?.phone && (
            <Pressable
              onPress={() => openQuickWhatsApp(task.contact, task.deal, `Hi ${task.contact.name}, regarding ${task.title}...`)}
              className="flex-row items-center gap-x-1 rounded-lg px-2 py-0.5 border"
              style={{
                backgroundColor: colors.whatsappSoft,
                borderColor: colors.whatsappBorder,
              }}
            >
              <Ionicons name="logo-whatsapp" size={11} color={colors.whatsapp} />
              <Text className="text-[9px] font-bold" style={{ color: colors.whatsapp }}>
                Follow-up
              </Text>
            </Pressable>
          )}

          {onDeletePrompt && (
            <Pressable
              onPress={() => onDeletePrompt(task)}
              hitSlop={8}
              className="p-1 active:opacity-60"
            >
              <Ionicons name="trash-outline" size={13} color={colors.textSoft} />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

