import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useAuthStore } from '../auth/auth.store';

/**
 * Minimal home screen for authenticated users.
 *
 * This is a placeholder that will be replaced by the real
 * dashboard/feed once those features are built. For now it
 * confirms the user is logged in and provides a logout button.
 */
export function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>
        👋 Hey, {user?.displayName ?? 'Athlete'}!
      </Text>
      <Text style={styles.subtitle}>
        @{user?.username} · Level {user?.level ?? 1} · {user?.xp ?? 0} XP
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>🏗️ Coming Soon</Text>
        <Text style={styles.cardText}>
          Activity tracking, friends, groups, challenges, leaderboards, and more
          are on the way.
        </Text>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 32,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
  logoutButton: {
    marginTop: 40,
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#475569',
  },
  logoutText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
});
