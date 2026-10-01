import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {
  getApiBaseUrl,
  setApiBaseUrl,
  initApiBaseUrl,
} from '../../services/api.client';

/**
 * A compact, collapsible bar that lets the user enter a custom server URL.
 * Shown at the top of Login / Register screens for dev / local testing.
 *
 * Usage:
 *   <ServerConfigBar />
 */
export function ServerConfigBar() {
  const [expanded, setExpanded] = useState(false);
  const [url, setUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [ready, setReady] = useState(false);

  // Load the persisted URL on mount
  useEffect(() => {
    initApiBaseUrl().then(() => {
      setUrl(getApiBaseUrl());
      setReady(true);
    });
  }, []);

  const handleSave = async () => {
    if (!url.trim()) return;
    setSaving(true);
    setSaved(false);
    try {
      await setApiBaseUrl(url);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  if (!ready) return null;

  // Collapsed: just a small tappable label
  if (!expanded) {
    return (
      <TouchableOpacity
        style={styles.collapsedBar}
        onPress={() => setExpanded(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.collapsedIcon}>⚙️</Text>
        <Text style={styles.collapsedText} numberOfLines={1}>
          Server: {getApiBaseUrl()}
        </Text>
      </TouchableOpacity>
    );
  }

  // Expanded: URL input + Save button
  return (
    <View style={styles.expandedBar}>
      <View style={styles.headerRow}>
        <Text style={styles.headerLabel}>🔧 Server URL</Text>
        <TouchableOpacity onPress={() => setExpanded(false)}>
          <Text style={styles.closeBtn}>✕</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={url}
          onChangeText={setUrl}
          placeholder="http://192.168.x.x:3000/api/v1"
          placeholderTextColor="#64748b"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          selectTextOnFocus
        />
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.7}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>{saved ? '✓' : 'Save'}</Text>
          )}
        </TouchableOpacity>
      </View>
      {saved && (
        <Text style={styles.savedHint}>URL saved — try signing in now</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  /* ── Collapsed ── */
  collapsedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  collapsedIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  collapsedText: {
    flex: 1,
    fontSize: 12,
    color: '#94a3b8',
  },

  /* ── Expanded ── */
  expandedBar: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#cbd5e1',
  },
  closeBtn: {
    fontSize: 16,
    color: '#94a3b8',
    paddingHorizontal: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#f8fafc',
    borderWidth: 1,
    borderColor: '#475569',
  },
  saveBtn: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 56,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  savedHint: {
    color: '#4ade80',
    fontSize: 12,
    marginTop: 6,
  },
});
