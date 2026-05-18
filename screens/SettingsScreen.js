import React, { useContext } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import IconBadge from '../components/IconBadge';
import { AppContext } from '../utils/appContext';
import { useTheme } from '../utils/theme';

const OCR_MODES = ['auto', 'handwritten', 'printed'];

export default function SettingsScreen({ navigation }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const systemScheme = useColorScheme();
  const { settings, resetAllData, updateSettings } = useContext(AppContext);
  const resolvedScheme = settings.themeMode === 'system' ? systemScheme : settings.themeMode;
  const themeLabel = resolvedScheme === 'dark' ? 'Dark' : 'Light';
  const ocrModeLabel = settings.ocrMode === 'handwritten' ? 'Handwritten' : settings.ocrMode === 'printed' ? 'Printed' : 'Auto';

  const cycleOcrMode = () => {
    const currentIndex = Math.max(0, OCR_MODES.indexOf(settings.ocrMode || 'auto'));
    const nextMode = OCR_MODES[(currentIndex + 1) % OCR_MODES.length];
    updateSettings({ ocrMode: nextMode });
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.BACKGROUND }]}> 
      <View style={[styles.topBar, { backgroundColor: theme.PRIMARY, paddingTop: insets.top + 14 }]}> 
        <Pressable hitSlop={12} onPress={() => navigation.navigate('Scan')}>
          <Ionicons name="arrow-back" size={22} color={theme.ON_PRIMARY} />
        </Pressable>
        <Text style={[styles.topTitle, { color: theme.ON_PRIMARY }]}>Settings</Text>
        <View style={styles.topBarSide} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SectionLabel title="Preferences" />
        <GroupedCard>
          <SettingRow
            icon={<IconBadge backgroundColor={theme.ICON_BADGE_PURPLE} iconColor={theme.ICON_COLOR_PURPLE} iconName="code-slash" />}
            title="Default Language"
            value="Python, C, C++"
            readOnly
          />
          <SettingRow
            icon={<IconBadge backgroundColor={theme.ICON_BADGE_PURPLE} iconColor={theme.ICON_COLOR_PURPLE} iconName="sparkles-outline" />}
            title="OCR Mode"
            value={ocrModeLabel}
            onPress={cycleOcrMode}
          />
          <SettingRow
            icon={<IconBadge backgroundColor={theme.ICON_BADGE_PURPLE} iconColor={theme.ICON_COLOR_PURPLE} iconName="color-palette-outline" />}
            title="Theme"
            value={themeLabel}
            readOnly
          />
          <SettingToggleRow
            icon={<IconBadge backgroundColor={theme.ICON_BADGE_AMBER} iconColor={theme.ICON_COLOR_AMBER} iconName="notifications-outline" />}
            title="Notifications"
            switchValue={Boolean(settings.notificationsEnabled)}
            onValueChange={(value) => updateSettings({ notificationsEnabled: value })}
          />
        </GroupedCard>

        <SectionLabel title="OCR Settings" />
        <GroupedCard>
          <SettingRow
            icon={<IconBadge backgroundColor={theme.ICON_BADGE_TEAL} iconColor={theme.ICON_COLOR_TEAL} iconName="camera-outline" />}
            title="OCR Engine"
            value="ML Kit + Google Vision"
            readOnly
          />
          <SettingToggleRow
            icon={<IconBadge backgroundColor={theme.ICON_BADGE_TEAL} iconColor={theme.ICON_COLOR_TEAL} iconName="options-outline" />}
            title="Handwriting Enhancement"
            switchValue={Boolean(settings.handwritingEnhancement)}
            onValueChange={(value) => updateSettings({ handwritingEnhancement: value })}
          />
          <SettingRow
            icon={<IconBadge backgroundColor={theme.ICON_BADGE_TEAL} iconColor={theme.ICON_COLOR_TEAL} iconName="options-outline" />}
            title="Image Enhancement"
            value={String(settings.imageEnhancement || 'High')}
            readOnly
          />
        </GroupedCard>

        <SectionLabel title="About" />
        <GroupedCard>
          <SettingRow
            icon={<IconBadge backgroundColor={theme.ICON_BADGE_BLUE} iconColor={theme.ICON_COLOR_BLUE} iconName="information-circle-outline" />}
            title="About SnapScript"
            onPress={() => Alert.alert('About SnapScript', 'SnapScript is an Android research app for scanning, analyzing, and reviewing code with OCR, authorship detection, and syntax diagnosis.')}
          />
          <SettingRow
            icon={<IconBadge backgroundColor={theme.ICON_BADGE_PURPLE} iconColor={theme.ICON_COLOR_PURPLE} iconName="document-text-outline" />}
            title="Terms & Privacy"
            onPress={() => Alert.alert('Terms & Privacy', 'SnapScript stores scan history locally on the device. Authorship detection uses your configured backend endpoint when available.')}
          />
        </GroupedCard>

        <Pressable
          style={styles.resetButton}
          onPress={() =>
            Alert.alert('Reset All Settings', 'This clears saved scan history and restores the default preferences.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Reset', style: 'destructive', onPress: resetAllData },
            ])
          }
        >
          <Text style={[styles.resetText, { color: theme.ERROR }]}>Reset All Settings</Text>
        </Pressable>

        <Text style={[styles.versionText, { color: theme.TEXT_HINT }]}>SnapScript v1.0.0 · Built with React Native</Text>
      </ScrollView>
    </View>
  );
}

function SectionLabel({ title }) {
  const theme = useTheme();
  return <Text style={[styles.sectionLabel, { color: theme.PREF_LABEL }]}>{title.toUpperCase()}</Text>;
}

function GroupedCard({ children }) {
  const theme = useTheme();
  return <View style={[styles.card, { backgroundColor: theme.PREF_SECTION_BG, borderColor: theme.CARD_BORDER }]}>{children}</View>;
}

function SettingRow({ icon, title, value, onPress, readOnly = false }) {
  const theme = useTheme();

  return (
    <Pressable style={[styles.row, { borderBottomColor: theme.PREF_ROW_BORDER }]} onPress={onPress} disabled={readOnly || !onPress}>
      <View style={styles.leftSide}>
        {icon}
        <Text style={[styles.rowTitle, { color: theme.TEXT_PRIMARY }]}>{title}</Text>
      </View>
      <View style={styles.rightSide}>
        {value ? <Text style={[styles.rowValue, { color: theme.TEXT_MUTED }]}>{value}</Text> : null}
        {onPress && !readOnly ? <Ionicons name="chevron-forward" size={18} color={theme.TEXT_HINT} /> : null}
      </View>
    </Pressable>
  );
}

function SettingToggleRow({ icon, title, switchValue, onValueChange }) {
  const theme = useTheme();

  return (
    <View style={[styles.row, { borderBottomColor: theme.PREF_ROW_BORDER }]}>
      <View style={styles.leftSide}>
        {icon}
        <Text style={[styles.rowTitle, { color: theme.TEXT_PRIMARY }]}>{title}</Text>
      </View>
      <Switch
        trackColor={{ false: theme.CONFBAR_BG, true: theme.PRIMARY }}
        thumbColor={theme.ON_PRIMARY}
        value={switchValue}
        onValueChange={onValueChange}
      />
    </View>
  );
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
  content: {
    padding: 16,
    paddingBottom: 24,
    gap: 10,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 6,
  },
  card: {
    borderWidth: 1,
    borderRadius: 18,
    overflow: 'hidden',
  },
  row: {
    minHeight: 58,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderBottomWidth: 1,
  },
  leftSide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  rightSide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '700',
    flexShrink: 1,
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  resetButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 8,
  },
  resetText: {
    fontSize: 15,
    fontWeight: '800',
  },
  versionText: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 6,
  },
});
