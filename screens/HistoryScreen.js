import React, { useContext, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppContext } from '../utils/appContext';
import { getLanguageDisplayName, useTheme } from '../utils/theme';

export default function HistoryScreen({ navigation }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { history, hydrated } = useContext(AppContext);
  const [filter, setFilter] = useState('all');

  const entries = useMemo(() => {
    const sorted = [...history].sort((left, right) => Number(right.timestamp || 0) - Number(left.timestamp || 0));

    if (filter === 'human') {
      return sorted.filter((item) => item.authorshipType === 'Human-Written');
    }

    if (filter === 'ai') {
      return sorted.filter((item) => item.authorshipType === 'AI-Generated');
    }

    return sorted;
  }, [filter, history]);

  return (
    <View style={[styles.screen, { backgroundColor: theme.BACKGROUND }]}> 
      <View style={[styles.topBar, { backgroundColor: theme.PRIMARY, paddingTop: insets.top + 14 }]}> 
        <View style={styles.topBarSide} />
        <Text style={[styles.topTitle, { color: theme.ON_PRIMARY }]}>History</Text>
        <Pressable hitSlop={12} onPress={() => Alert.alert('Search', 'Search is not implemented yet.')}> 
          <Ionicons name="search" size={22} color={theme.ON_PRIMARY} />
        </Pressable>
      </View>

      <View style={styles.filterShell}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          <FilterPill label="All" active={filter === 'all'} onPress={() => setFilter('all')} />
          <FilterPill label="Human-Written" active={filter === 'human'} icon="person-outline" onPress={() => setFilter('human')} />
          <FilterPill label="AI-Generated" active={filter === 'ai'} icon="hardware-chip-outline" onPress={() => setFilter('ai')} />
        </ScrollView>
      </View>

      {!hydrated ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={theme.PRIMARY} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={[styles.content, entries.length === 0 && styles.emptyContent]} showsVerticalScrollIndicator={false}>
          {entries.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconCircle, { backgroundColor: theme.PILL_GHOST_BG }]}> 
                <Ionicons name="time-outline" size={28} color={theme.TEXT_MUTED} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.TEXT_PRIMARY }]}>No scan history yet</Text>
              <Text style={[styles.emptySubtitle, { color: theme.TEXT_MUTED }]}>Your scanned code results will appear here. Start by scanning a code image.</Text>
              <Pressable style={[styles.scanButton, { backgroundColor: theme.PRIMARY }]} onPress={() => navigation.navigate('Scan')}> 
                <Ionicons name="scan-outline" size={18} color={theme.ON_PRIMARY} />
                <Text style={[styles.scanButtonText, { color: theme.ON_PRIMARY }]}>Scan Code</Text>
              </Pressable>
            </View>
          ) : (
            entries.map((item, index) => (
              <React.Fragment key={item.id}>
                <HistoryRow item={item} onPress={() => navigation.navigate('Result', { savedScan: item })} />
                {index < entries.length - 1 ? <View style={[styles.separator, { backgroundColor: theme.DIVIDER }]} /> : null}
              </React.Fragment>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

function FilterPill({ label, active, icon, onPress }) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.filterPill,
        {
          backgroundColor: active ? theme.PILL_ACTIVE_BG : theme.PILL_GHOST_BG,
          borderColor: active ? theme.PILL_ACTIVE_BG : theme.PILL_GHOST_BORDER,
        },
      ]}
    >
      {icon ? <Ionicons name={icon} size={14} color={active ? theme.PILL_ACTIVE_TEXT : theme.PILL_GHOST_TEXT} /> : null}
      <Text style={[styles.filterPillText, { color: active ? theme.PILL_ACTIVE_TEXT : theme.PILL_GHOST_TEXT }]}>{label}</Text>
    </Pressable>
  );
}

function HistoryRow({ item, onPress }) {
  const theme = useTheme();
  const humanWritten = item.authorshipType === 'Human-Written';
  const errorCount = Number(item.errorCount || 0);
  const ocrType = String(item.ocrType || 'unknown');
  const ocrBadgeColors = ocrType === 'handwritten'
    ? { backgroundColor: theme.ICON_BADGE_AMBER, color: theme.ICON_COLOR_AMBER, icon: 'pencil-outline', label: 'Handwritten' }
    : { backgroundColor: theme.ICON_BADGE_BLUE, color: theme.ICON_COLOR_BLUE, icon: 'print-outline', label: 'Printed' };

  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={[styles.avatar, { backgroundColor: humanWritten ? theme.SUCCESS_BG : theme.ERROR_BG }]}> 
        {humanWritten ? <Ionicons name="person" size={18} color={theme.SUCCESS} /> : <Text style={[styles.aiAvatarText, { color: theme.ERROR }]}>AI</Text>}
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowTitle, { color: theme.TEXT_PRIMARY }]}>{item.authorshipType || 'Human-Written'}</Text>
        <Text style={[styles.rowMeta, { color: theme.TEXT_MUTED }]}>{getLanguageDisplayName(item.language)} · {formatRelativeTime(item.timestamp)}</Text>
        <View style={styles.rowBadges}>
          <View style={[styles.modeBadge, { backgroundColor: ocrBadgeColors.backgroundColor }]}> 
            <Ionicons name={ocrBadgeColors.icon} size={12} color={ocrBadgeColors.color} />
            <Text style={[styles.modeBadgeText, { color: ocrBadgeColors.color }]}>{ocrBadgeColors.label}</Text>
          </View>
          <Text style={[styles.rowErrors, { color: errorCount > 0 ? theme.ERROR : theme.SUCCESS }]}>
            {errorCount > 0 ? `${errorCount} errors` : '0 errors'}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.TEXT_HINT} />
    </Pressable>
  );
}

function formatRelativeTime(timestamp) {
  const diffMs = Math.max(0, Date.now() - Number(timestamp || Date.now()));
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) {
    return 'just now';
  }

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hr ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  topBarSide: {
    width: 22,
  },
  topTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '800',
  },
  filterShell: {
    paddingTop: 10,
  },
  filterRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  filterPill: {
    height: 30,
    borderRadius: 20,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  emptyContent: {
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 28,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: 18,
  },
  scanButton: {
    borderRadius: 10,
    minHeight: 44,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  scanButtonText: {
    fontSize: 14,
    fontWeight: '800',
  },
  row: {
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiAvatarText: {
    fontSize: 11,
    fontWeight: '900',
  },
  rowContent: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  rowMeta: {
    fontSize: 13,
    marginTop: 2,
  },
  rowBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 6,
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  modeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  rowErrors: {
    fontSize: 13,
    fontWeight: '700',
  },
  separator: {
    height: 1,
  },
});
