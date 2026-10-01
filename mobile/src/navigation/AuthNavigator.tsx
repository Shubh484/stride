import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../features/auth/LoginScreen';
import { RegisterScreen } from '../features/auth/RegisterScreen';
import { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

/**
 * Auth navigator shown when the user is NOT authenticated.
 *
 * Uses a wrapper approach: LoginScreen and RegisterScreen accept
 * `onSwitchToRegister` / `onSwitchToLogin` callbacks. We satisfy
 * those by navigating within this stack, which keeps the screen
 * components navigation-agnostic (they don't import useNavigation).
 */
export function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0f172a' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Login">
        {(props) => (
          <LoginScreen
            onSwitchToRegister={() => props.navigation.navigate('Register')}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Register">
        {(props) => (
          <RegisterScreen
            onSwitchToLogin={() => props.navigation.navigate('Login')}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
