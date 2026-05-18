import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Pressable, Text, View } from 'react-native';

import ScanScreen from '../screens/ScanScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ResultScreen from '../screens/ResultScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { useTheme } from '../utils/theme';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function TabsNavigator() {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: theme.NAV_BG,
          borderTopColor: theme.NAV_BORDER,
          borderTopWidth: 1,
          height: 68,
          paddingTop: 8,
          paddingBottom: 8,
          elevation: 0,
        },
      }}
    >
      <Tab.Screen
        name="Scan"
        component={ScanScreen}
        options={{
          tabBarButton: (props) => <TabBarButton {...props} icon="scan-outline" label="Scan" focused={props.accessibilityState?.selected} />,
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarButton: (props) => <TabBarButton {...props} icon="time-outline" label="History" focused={props.accessibilityState?.selected} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarButton: (props) => <TabBarButton {...props} icon="settings-outline" label="Settings" focused={props.accessibilityState?.selected} />,
        }}
      />
    </Tab.Navigator>
  );
}

function TabBarButton({ icon, label, focused, onPress, accessibilityState }) {
  const theme = useTheme();
  const selected = Boolean(focused || accessibilityState?.selected);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.8 : 1 }]}> 
      <View style={styles.tabWrap}>
        <View
          style={[
            styles.pill,
            {
              backgroundColor: selected ? theme.NAV_ACTIVE_PILL : 'transparent',
            },
          ]}
        >
          <Ionicons name={icon} size={20} color={selected ? theme.PRIMARY : theme.NAV_INACTIVE} />
          <Text style={[styles.tabLabel, { color: selected ? theme.PRIMARY : theme.NAV_INACTIVE }]}>{label}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={TabsNavigator} />
        <Stack.Screen name="Result" component={ResultScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = {
  tabWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    minWidth: 74,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
};
