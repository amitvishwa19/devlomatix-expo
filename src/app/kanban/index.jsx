import React from 'react';
import { View } from 'react-native';
import AppScreen from '~/components/AppScreen';
import KanbanBoard from '~/components/kanban/KanbanBoard';
import { useCrm } from '~/providers/CrmProvider';
import { useCrmTheme } from '~/utils/crm/colors';
import CrmHeader from '../_components/CrmHeader';

export default function CrmKanbanScreen() {
  const { colors } = useCrmTheme();
  const { workspaceId } = useCrm();

  return (
    <AppScreen style={{ backgroundColor: colors.background }}>
      <CrmHeader
        title="Kanban Board"
        subtitle="Visual task & workflow management"
        showBack={true}
      />
      <View className="flex-1" style={{ backgroundColor: colors.background }}>
        <KanbanBoard workspaceId={workspaceId} />
      </View>
    </AppScreen>
  );
}
