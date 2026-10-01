import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../features/home/HomeScreen';
import { HealthScreen } from '../features/health/HealthScreen';
import { MainStackParamList } from './types';

const Stack = createNativeStackNavigator<MainStackParamList>();

/**
 * Main navigator shown when the user IS authenticated.
 *
 * Currently contains Home and Health (system diagnostic).
 * New feature screens (Profile, Activity, Groups, etc.)
 * will be added here as they are implemented.
 */
export function MainNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0f172a' },
        headerTintColor: '#f8fafc',
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: '#0f172a' },
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Health"
        component={HealthScreen}
        options={{ title: 'System Health' }}
      />
    </Stack.Navigator>
  );
}
