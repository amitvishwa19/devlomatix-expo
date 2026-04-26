import { Text, View } from 'react-native';

import KonnectXModuleShell from '~/components/konnectx/KonnectXModuleShell';
import { useAppTheme } from '~/theme/AppTheme';

const inbox = [
  { title: 'New sales inquiries', meta: '36 unread WhatsApp conversations' },
  { title: 'Support handoff queue', meta: '14 chats waiting for human takeover' },
  { title: 'Priority accounts', meta: '8 high-value conversations flagged for response' }
];

export default function KonnectXChatsScreen() {
  const { palette } = useAppTheme();

  return (
    <KonnectXModuleShell
      badge="CHATS"
      title="Conversation inbox"
      description="Watch active conversations, route unresolved threads, and keep support response time visible.">
      {inbox.map((item) =>
        <View key={item.title} className="mb-4 rounded-[24px] p-5" style={{ backgroundColor: palette.colors.surface }}>
          <Text className={`text-[18px] font-bold ${palette.text}`}>{item.title}</Text>
          <Text className={`mt-2 text-[14px] leading-6 ${palette.textSoft}`}>{item.meta}</Text>
        </View>
      )}
    </KonnectXModuleShell>);
}
