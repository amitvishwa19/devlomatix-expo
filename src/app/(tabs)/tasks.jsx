import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTheme } from "~/theme/AppTheme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { getSession } from "~/utils/authStorage";
import KanbanBoard from "~/components/kanban/KanbanBoard";

async function resolveWorkspaceId() {
  try {
    // Check if workspaceId was previously saved
    const savedWorkspaceId = await SecureStore.getItemAsync(
      "devlomatix.workspaceId",
    );
    if (savedWorkspaceId) return savedWorkspaceId;

    const session = await getSession();
    if (session?.user?.workspaceId) return session.user.workspaceId;
    if (session?.user?.currentWorkspace) return session.user.currentWorkspace;
    if (session?.user?.selectedServer) return session.user.selectedServer;
    if (session?.user?.members?.length)
      return session.user.members[0]?.serverId;
    if (session?.user?.workspaces?.length) {
      const defaultWorkspace =
        session.user.workspaces.find((w) => w.default) ||
        session.user.workspaces[0];
      if (defaultWorkspace) return defaultWorkspace.id;
    }
    if (session?.user?.servers?.length) {
      const defaultServer =
        session.user.servers.find((s) => s.default) || session.user.servers[0];
      if (defaultServer) return defaultServer.id;
    }
  } catch {}
  return null;
}

export default function TasksScreen() {
  const { palette } = useAppTheme();
  const [workspaceId, setWorkspaceId] = useState(null);

  useEffect(() => {
    resolveWorkspaceId().then((id) => {
      console.log("=== RESOLVED WORKSPACE ID ===", id);
      setWorkspaceId(id);
      if (id) {
        SecureStore.setItemAsync("devlomatix.workspaceId", id);
        AsyncStorage.setItem("devlomatix.workspaceId", id);
      }
    });
  }, []);

  return (
    <SafeAreaView className={`flex-1 ${palette.page}`}>
      <StatusBar style={palette.statusBar} />
      <View className={`flex-1 ${palette.page}`}>
        <View className="px-5 pb-2 pt-5">
          <View
            className={`mb-2 rounded-[28px] p-5 shadow-xl ${palette.surface} ${palette.shadow}`}
          >
            <Text
              className={`text-[12px] font-bold uppercase tracking-[1.8px] ${palette.accentText}`}
            >
              PIPELINE
            </Text>
            <Text
              className={`mt-1.5 text-[28px] font-bold leading-[34px] ${palette.text}`}
            >
              Kanban Board
            </Text>
            <Text
              className={`mt-1.5 text-[14px] leading-5 ${palette.textSoft}`}
            >
              Manage tasks across your workspace columns.
            </Text>
          </View>
        </View>

        {workspaceId ? (
          <KanbanBoard workspaceId={workspaceId} />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className={`text-[14px] ${palette.textMuted}`}>
              Loading workspace...
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
