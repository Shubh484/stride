import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { apiRequest } from '../../services/api.client';

interface HealthData {
  status: string;
  environment: string;
  uptime: number;
  services: {
    database: string;
    redis: string;
  };
}

export function HealthScreen() {
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<HealthData>('/health');
      setHealth(data);
    } catch (err) {
      setError((err as Error).message || 'Failed to connect to backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fitness Platform</Text>
      <Text style={styles.subtitle}>System Diagnostic</Text>

      {loading && <ActivityIndicator size="large" color="#0066cc" />}

      {error && (
        <View style={styles.cardError}>
          <Text style={styles.errorText}>Status: Disconnected</Text>
          <Text style={styles.detailText}>{error}</Text>
        </View>
      )}

      {health && (
        <View style={styles.cardSuccess}>
          <Text style={styles.statusText}>
            Backend: {health.status === 'ok' ? 'Online' : 'Degraded'}
          </Text>
          <Text style={styles.detailText}>Database: {health.services.database}</Text>
          <Text style={styles.detailText}>Redis: {health.services.redis}</Text>
          <Text style={styles.detailText}>Environment: {health.environment}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.button} onPress={fetchHealth}>
        <Text style={styles.buttonText}>Refresh Health Status</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#0f172a',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 24,
  },
  cardSuccess: {
    width: '100%',
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    borderLeftWidth: 4,
    borderLeftColor: '#22c55e',
    marginBottom: 20,
  },
  cardError: {
    width: '100%',
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
    marginBottom: 20,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  detailText: {
    color: '#cbd5e1',
    fontSize: 14,
    marginVertical: 2,
  },
  button: {
    marginTop: 12,
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
