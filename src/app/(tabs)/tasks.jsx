import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '~/theme/AppTheme';
import { getSession } from '~/utils/authStorage';
import KanbanBoard from '~/components/kanban/KanbanBoard';

const DEFAULT_WORKSPACE_ID = 'cmo0zg0vp0006ycikfwb9cmw0';

async function resolveWorkspaceId() {
  try {
    const session = await getSession();
    if (session?.user?.workspaceId) return session.user.workspaceId;
    if (session?.user?.currentWorkspace) return session.user.currentWorkspace;
    if (session?.user?.selectedServer) return session.user.selectedServer;
    if (session?.user?.members?.length) return session.user.members[0]?.serverId;
  } catch {}
  return DEFAULT_WORKSPACE_ID;
}

export default function TasksScreen() {
  const { palette } = useAppTheme();
  const [workspaceId, setWorkspaceId] = useState(null);

  useEffect(() => {
    resolveWorkspaceId().then(setWorkspaceId);
  }, []);

  return (
    <SafeAreaView className={`flex-1 ${palette.page}`}>
      <StatusBar style={palette.statusBar} />
      <View className={`flex-1 ${palette.page}`}>
        <View className="px-5 pb-2 pt-5">
          <View className={`mb-2 rounded-[28px] p-5 shadow-xl ${palette.surface} ${palette.shadow}`}>
            <Text className={`text-[12px] font-bold uppercase tracking-[1.8px] ${palette.accentText}`}>
              PIPELINE
            </Text>
            <Text className={`mt-1.5 text-[28px] font-bold leading-[34px] ${palette.text}`}>
              Kanban Board
            </Text>
            <Text className={`mt-1.5 text-[14px] leading-5 ${palette.textSoft}`}>
              Manage tasks across your workspace columns.
            </Text>
          </View>
        </View>

        {workspaceId ? (
          <KanbanBoard workspaceId={workspaceId} />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className={`text-[14px] ${palette.textMuted}`}>Loading workspace...</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
