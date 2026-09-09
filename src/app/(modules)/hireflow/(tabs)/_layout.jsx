import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '~/theme/AppTheme';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const tabConfig = {
  index: { icon: 'grid-outline', label: 'Dashboard' },
  jobs: { icon: 'briefcase-outline', label: 'Jobs' },
  candidates: { icon: 'people-outline', label: 'Candidates' },
  pipeline: { icon: 'git-branch-outline', label: 'Pipeline' },
  analytics: { icon: 'bar-chart-outline', label: 'Analytics' },
};

export default function HireFlowTabLayout() {
  const { palette } = useAppTheme();
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <CustomTabBar {...props} />}>
      {Object.entries(tabConfig).map(([name, cfg]) => (
        <Tabs.Screen key={name} name={name} options={{ title: cfg.label }} />
      ))}
    </Tabs>
  );
}

function CustomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const { palette } = useAppTheme();

  return (
    <View
      pointerEvents="box-none"
      className="absolute bottom-2 left-0 right-0 items-center"
      style={{
        paddingBottom: Math.max(insets.bottom, 10),
        zIndex: 100,
        elevation: 20,
      }}
    >
      <Animated.View
        className="w-[95%] flex-row items-center justify-around rounded-2xl px-2 py-3"
        style={{
          backgroundColor: palette.colors.tabBar,
          zIndex: 100,
          elevation: 20,
        }}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.title || route.name;
          const isFocused = state.index === index;
          const cfg = tabConfig[route.name];

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <AnimatedTouchableOpacity
              key={route.key}
              layout={LinearTransition.springify().mass(0.5)}
              onPress={onPress}
              className="flex-row items-center gap-x-2 rounded-xl p-2"
              style={{ backgroundColor: isFocused ? palette.colors.tabActive : 'transparent' }}
            >
              <Ionicons
                size={20}
                name={cfg?.icon || 'ellipse-outline'}
                color={isFocused ? palette.tabActiveIcon : palette.tabInactiveIcon}
              />
              {isFocused ? (
                <Animated.Text
                  entering={FadeIn.duration(200)}
                  exiting={FadeOut.duration(200)}
                  className="text-[11px] font-bold"
                  style={{ color: palette.tabActiveTextColor }}
                >
                  {label}
                </Animated.Text>
              ) : null}
            </AnimatedTouchableOpacity>
          );
        })}
      </Animated.View>
    </View>
  );
}
