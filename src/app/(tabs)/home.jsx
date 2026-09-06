import { View } from 'react-native';
import AppScreen from '~/components/AppScreen';
import UserStatusBar from '~/components/UserStatusBar';

export default function HomeScreen() {
    return (
        <AppScreen>
            <View className="flex-1">
                <UserStatusBar />
                <View className="flex-1" />
            </View>
        </AppScreen>
    );
}
