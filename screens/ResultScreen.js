import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import CodeEditor from '@rivascva/react-native-code-editor';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppContext } from '../utils/appContext';
import { checkAuthorship } from '../utils/authorshipApi';
import { checkSyntax } from '../utils/pistonApi';
import { detectLanguage } from '../utils/languageDetector';
import {
  getEditorLanguage,
  getEditorSyntaxStyle,
  getFilenameForLanguage,
  getLanguageDisplayName,
  useTheme,
} from '../utils/theme';

const EMPTY_SYNTAX = { errors: [], warnings: [], all: [] };

export default function ResultScreen({ navigation, route }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { saveScanResult } = useContext(AppContext);
  const params = route?.params || {};
  const savedScan = params.savedScan || null;
  const initialCode = String(savedScan?.code ?? params.ocrText ?? '').trim();
  const initialDetectedLanguage = savedScan?.language
    ? {
        language: savedScan.language,
        displayName: savedScan.languageDisplayName || getLanguageDisplayName(savedScan.language),
      }
    : params.detectedLanguage || detectLanguage(initialCode);

  const [code, setCode] = useState(initialCode);
  const [authorship, setAuthorship] = useState(savedScan?.authorshipType ? {
    type: savedScan.authorshipType,
    confidence: Number(savedScan.authorshipConfidence ?? savedScan.confidence ?? 0),
    ocrType: savedScan.ocrType || params.ocrType || 'unknown',
  } : null);
  const [syntax, setSyntax] = useState(savedScan?.syntax || EMPTY_SYNTAX);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const analysisIdRef = useRef(savedScan?.id || `${Date.now()}`);
  const initialOcrType = savedScan?.ocrType || params.ocrType || 'unknown';
  const ocrConfidence = Number(savedScan?.ocrConfidence ?? params.ocrConfidence ?? 0);

  const detectedLanguage = useMemo(() => {
    const detected = detectLanguage(code);
    if (detected.language !== 'unknown') {
      return detected;
    }

    return initialDetectedLanguage;
  }, [code, initialDetectedLanguage]);

  useEffect(() => {
    if (savedScan?.code) {
      setCode(String(savedScan.code));
    }
  }, [savedScan]);

  const editorLanguage = getEditorLanguage(detectedLanguage.language);
  const filename = getFilenameForLanguage(detectedLanguage.language);
  const editorSyntaxStyle = useMemo(() => getEditorSyntaxStyle(theme), [theme]);
  const isHandwritten = initialOcrType === 'handwritten';
  const authorshipConfidence = Number(authorship?.confidence ?? savedScan?.authorshipConfidence ?? 0);
  const isHumanWritten = String(authorship?.type || savedScan?.authorshipType || 'Human-Written') === 'Human-Written';
  const syntaxErrors = syntax.errors || [];
  const syntaxWarnings = syntax.warnings || [];
  const syntaxAll = syntax.all || [];
  const hasSavedAnalysis = Boolean(savedScan?.authorshipType || syntaxAll.length || syntaxErrors.length || syntaxWarnings.length);
  const hasAnalysis = Boolean(authorship || hasSavedAnalysis);

  const filteredDiagnostics = useMemo(() => {
    if (filter === 'errors') {
      return syntaxErrors;
    }

    if (filter === 'warnings') {
      return syntaxWarnings;
    }

    return syntaxAll;
  }, [filter, syntaxAll, syntaxErrors, syntaxWarnings]);

  const ocrConfidencePercent = Math.round(ocrConfidence * 100);
  const ocrConfidenceColor = ocrConfidencePercent < 70 ? theme.WARNING : theme.SUCCESS;
  const analysisConfidencePercent = Math.round(authorshipConfidence * 100);
  const analysisConfidenceColor = isHumanWritten ? theme.SUCCESS : theme.ERROR;

  const copyCode = async () => {
    await Clipboard.setStringAsync(code);
    Alert.alert('Copied', 'The code was copied to your clipboard.');
  };

  const shareCode = async () => {
    await Share.share({ message: code, title: 'SnapScript code' });
  };

  const runAnalysis = async () => {
    if (!code.trim()) {
      Alert.alert('Empty code', 'The code editor is empty.');
      return;
    }

    setAnalysisLoading(true);

    try {
      const currentLanguage = detectLanguage(code);
      const [authorshipResult, syntaxResult] = await Promise.all([
        checkAuthorship(code, initialOcrType),
        checkSyntax(code, currentLanguage.language),
      ]);

      setAuthorship(authorshipResult);
      setSyntax(syntaxResult);

      saveScanResult({
        id: analysisIdRef.current,
        timestamp: Date.now(),
        code,
        ocrText: String(params.ocrText || code),
        ocrType: initialOcrType,
        ocrConfidence,
        language: currentLanguage.language,
        languageDisplayName: currentLanguage.displayName,
        authorshipType: authorshipResult.type,
        authorshipConfidence: authorshipResult.confidence,
        syntax: syntaxResult,
        errorCount: syntaxResult.errors.length,
        warningCount: syntaxResult.warnings.length,
      });
    } catch (error) {
      Alert.alert('Analysis failed', 'SnapScript could not run authorship or syntax analysis.');
    } finally {
      setAnalysisLoading(false);
    }
  };

  const goToScanTab = () => {
    navigation.navigate('Tabs', { screen: 'Scan' });
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.BACKGROUND }]}> 
      <View style={[styles.topBar, { backgroundColor: theme.PRIMARY, paddingTop: insets.top + 14 }]}> 
        <Pressable hitSlop={12} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={theme.ON_PRIMARY} />
        </Pressable>
        <Text style={[styles.topTitle, { color: theme.ON_PRIMARY }]}>Result</Text>
        <Pressable hitSlop={12} onPress={shareCode}>
          <Ionicons name="share-social-outline" size={22} color={theme.ON_PRIMARY} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SectionHeader title="Code IDE" index="1" />

        <View style={[styles.card, { backgroundColor: theme.CARD_BG, borderColor: theme.CARD_BORDER }]}> 
          <View style={styles.codeTopRow}>
            <View style={[styles.languageBadgeWrap, { backgroundColor: theme.SUCCESS_BG }]}> 
              <Ionicons name="checkmark-circle" size={14} color={theme.SUCCESS} />
              <Text style={[styles.languageBadgeText, { color: theme.SUCCESS }]}>
                {`${detectedLanguage.displayName} — Auto Detected`}
              </Text>
            </View>

            <View style={styles.codeToolsRight}>
              <View style={[styles.ocrBadge, { backgroundColor: isHandwritten ? theme.ICON_BADGE_AMBER : theme.ICON_BADGE_BLUE }]}> 
                <Ionicons name={isHandwritten ? 'pencil-outline' : 'print-outline'} size={13} color={isHandwritten ? theme.ICON_COLOR_AMBER : theme.ICON_COLOR_BLUE} />
                <Text style={[styles.ocrBadgeText, { color: isHandwritten ? theme.ICON_COLOR_AMBER : theme.ICON_COLOR_BLUE }]}>
                  {isHandwritten ? 'Handwritten' : 'Printed'}
                </Text>
              </View>
              <Pressable onPress={copyCode} hitSlop={12}>
                <Ionicons name="copy-outline" size={20} color={theme.TEXT_MUTED} />
              </Pressable>
            </View>
          </View>

          <View style={[styles.editorToolbar, { backgroundColor: theme.IDE_HEADER }]}> 
            <Text style={[styles.filenameTab, { color: theme.IDE_DEFAULT }]}>{filename}</Text>
            <Pressable onPress={copyCode} hitSlop={12}>
              <Ionicons name="copy-outline" size={18} color={theme.IDE_DEFAULT} />
            </Pressable>
          </View>

          <View style={[styles.editorShell, { backgroundColor: theme.IDE_BG }]}> 
            <CodeEditor
              key={`${filename}-${analysisIdRef.current}`}
              language={editorLanguage}
              syntaxStyle={editorSyntaxStyle}
              initialValue={code}
              onChange={setCode}
              showLineNumbers
              style={{
                backgroundColor: theme.IDE_BG,
                color: theme.IDE_DEFAULT,
                lineNumbersColor: theme.IDE_LINENUMS,
                lineNumbersBackgroundColor: theme.IDE_HEADER,
              }}
            />
          </View>

          <View style={styles.confidenceRow}>
            <Text style={[styles.confidenceLabel, { color: theme.TEXT_MUTED }]}>OCR Confidence: {ocrConfidencePercent}%</Text>
            <View style={[styles.progressTrack, { backgroundColor: theme.CONFBAR_BG }]}> 
              <View style={[styles.progressFill, { width: `${Math.max(4, Math.min(100, ocrConfidencePercent))}%`, backgroundColor: ocrConfidenceColor }]} />
            </View>
          </View>

          {isHandwritten ? (
            <View style={[styles.hintBox, { backgroundColor: theme.FILTER_WARN_BG, borderColor: theme.FILTER_WARN_TEXT }]}> 
              <Ionicons name="pencil-outline" size={16} color={theme.FILTER_WARN_TEXT} />
              <Text style={[styles.hintText, { color: theme.FILTER_WARN_TEXT }]}>Handwritten scan - please review and correct any misread characters before analysis</Text>
            </View>
          ) : null}
        </View>

        <SectionHeader title="Authorship Detection" index="2" />

        <View style={[styles.card, { backgroundColor: theme.CARD_BG, borderColor: theme.CARD_BORDER }]}> 
          <Pressable style={[styles.runButton, { backgroundColor: theme.PRIMARY }]} onPress={runAnalysis} disabled={analysisLoading}>
            {analysisLoading ? <ActivityIndicator color={theme.ON_PRIMARY} /> : <Ionicons name="analytics-outline" size={18} color={theme.ON_PRIMARY} />}
            <Text style={[styles.runButtonText, { color: theme.ON_PRIMARY }]}>Run Analysis</Text>
          </Pressable>

          {analysisLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="small" color={theme.PRIMARY} />
              <Text style={[styles.loadingText, { color: theme.TEXT_MUTED }]}>Analyzing authorship...</Text>
            </View>
          ) : !hasAnalysis ? (
            <View style={styles.placeholderCard}>
              <Ionicons name="analytics-outline" size={18} color={theme.TEXT_HINT} />
              <Text style={[styles.placeholderText, { color: theme.TEXT_MUTED }]}>Tap Run Analysis after editing the OCR text.</Text>
            </View>
          ) : (
            <View style={[styles.authorshipInnerCard, { backgroundColor: theme.AUTH_INNER_BG, borderColor: theme.AUTH_INNER_BORDER }]}> 
              <View style={[styles.authorshipIcon, { backgroundColor: isHumanWritten ? theme.SUCCESS_BG : theme.ERROR_BG }]}> 
                <Ionicons name={isHumanWritten ? 'checkmark-circle' : 'close-circle'} size={18} color={isHumanWritten ? theme.SUCCESS : theme.ERROR} />
              </View>
              <View style={styles.authorshipContent}>
                <Text style={[styles.authorshipTitle, { color: theme.TEXT_PRIMARY }]}>{isHumanWritten ? 'Human-Written Code' : 'AI-Generated Code'}</Text>
                <Text style={[styles.authorshipConfidence, { color: analysisConfidenceColor }]}>
                  {analysisConfidencePercent}% confidence
                </Text>
                <View style={[styles.progressTrack, { backgroundColor: theme.CONFBAR_BG }]}> 
                  <View style={[styles.progressFill, { width: `${Math.max(4, Math.min(100, analysisConfidencePercent))}%`, backgroundColor: analysisConfidenceColor }]} />
                </View>
                <View style={styles.metaRow}>
                  <Text style={[styles.metaText, { color: theme.TEXT_MUTED }]}>Model: CodeBERT</Text>
                  <Text style={[styles.metaText, { color: theme.TEXT_MUTED }]}>Threshold: 0.50</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        <SectionHeader title="Syntax Diagnosis" index="3" />

        <View style={[styles.card, { backgroundColor: theme.CARD_BG, borderColor: theme.CARD_BORDER }]}> 
          {analysisLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="small" color={theme.PRIMARY} />
              <Text style={[styles.loadingText, { color: theme.TEXT_MUTED }]}>Checking syntax with Piston...</Text>
            </View>
          ) : !hasAnalysis ? (
            <View style={styles.placeholderCard}>
              <Ionicons name="code-slash-outline" size={18} color={theme.TEXT_HINT} />
              <Text style={[styles.placeholderText, { color: theme.TEXT_MUTED }]}>Run analysis to see syntax errors and warnings here.</Text>
            </View>
          ) : (
            <>
              <View style={styles.filterRow}>
                <FilterPill label="All" active={filter === 'all'} onPress={() => setFilter('all')} />
                <FilterPill label="Errors" active={filter === 'errors'} onPress={() => setFilter('errors')} />
                <FilterPill label="Warnings" active={filter === 'warnings'} onPress={() => setFilter('warnings')} />
              </View>

              <View style={styles.diagnosticsList}>
                {filteredDiagnostics.map((item, index) => (
                  <DiagnosticRow key={`${item.type}-${item.line}-${index}`} item={item} />
                ))}
                {!filteredDiagnostics.length ? <Text style={[styles.emptyText, { color: theme.TEXT_MUTED }]}>No syntax issues detected.</Text> : null}
              </View>
            </>
          )}
        </View>

        <Pressable style={[styles.scanAnotherButton, { backgroundColor: theme.PRIMARY }]} onPress={goToScanTab}>
          <Text style={[styles.scanAnotherText, { color: theme.ON_PRIMARY }]}>SCAN ANOTHER CODE</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function SectionHeader({ title, index }) {
  const theme = useTheme();

  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionBadge, { backgroundColor: theme.PRIMARY }]}> 
        <Text style={[styles.sectionBadgeText, { color: theme.ON_PRIMARY }]}>{index}</Text>
      </View>
      <Text style={[styles.sectionTitle, { color: theme.TEXT_PRIMARY }]}>{title}</Text>
    </View>
  );
}

function FilterPill({ label, active, onPress }) {
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
      <Text style={[styles.filterPillText, { color: active ? theme.PILL_ACTIVE_TEXT : theme.PILL_GHOST_TEXT }]}>{label}</Text>
    </Pressable>
  );
}

function DiagnosticRow({ item }) {
  const theme = useTheme();
  const isWarning = item.type === 'warning';
  const backgroundColor = isWarning ? theme.WARNING_BG : theme.ERROR_BG;
  const iconColor = isWarning ? theme.WARNING : theme.ERROR;

  return (
    <Pressable style={styles.diagnosticRow} onPress={() => Alert.alert(item.title, item.description || 'No additional details were provided.')}> 
      <View style={[styles.diagnosticIcon, { backgroundColor }]}> 
        <View style={[styles.diagnosticDot, { backgroundColor: iconColor }]} />
      </View>
      <View style={styles.diagnosticContent}>
        <Text style={[styles.diagnosticTitle, { color: theme.TEXT_PRIMARY }]}>{item.title}</Text>
        <Text style={[styles.diagnosticDescription, { color: theme.TEXT_MUTED }]}>{item.description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.TEXT_MUTED} />
    </Pressable>
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
  topTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '800',
  },
  content: {
    padding: 16,
    gap: 14,
    paddingBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  sectionBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionBadgeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
  },
  codeTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  languageBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexShrink: 1,
  },
  languageBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    flexShrink: 1,
  },
  codeToolsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ocrBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  ocrBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  editorToolbar: {
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  filenameTab: {
    fontSize: 13,
    fontWeight: '700',
  },
  editorShell: {
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    overflow: 'hidden',
    minHeight: 280,
  },
  confidenceRow: {
    marginTop: 12,
    gap: 8,
  },
  confidenceLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  hintBox: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  hintText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  runButton: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  runButtonText: {
    fontSize: 15,
    fontWeight: '800',
  },
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 72,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
  },
  placeholderCard: {
    minHeight: 72,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  placeholderText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '600',
  },
  authorshipInnerCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
  },
  authorshipIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorshipContent: {
    flex: 1,
    gap: 6,
  },
  authorshipTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  authorshipConfidence: {
    fontSize: 13,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 4,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filterPill: {
    height: 32,
    borderRadius: 20,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  diagnosticsList: {
    gap: 10,
  },
  diagnosticRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  diagnosticIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diagnosticDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  diagnosticContent: {
    flex: 1,
    gap: 2,
  },
  diagnosticTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  diagnosticDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '600',
  },
  scanAnotherButton: {
    minHeight: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanAnotherText: {
    fontSize: 15,
    fontWeight: '900',
  },
  
  loadingWrap: {
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
  },
  authorshipInnerCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  authorshipIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  authorshipContent: {
    flex: 1,
    gap: 6,
  },
  authorshipTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  authorshipConfidence: {
    fontSize: 13,
    fontWeight: '700',
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filterPill: {
    height: 28,
    borderRadius: 20,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  diagnosticsList: {
    gap: 10,
  },
  diagnosticRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  diagnosticIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diagnosticDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  diagnosticContent: {
    flex: 1,
  },
  diagnosticTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  diagnosticDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '600',
  },
  scanAnotherButton: {
    borderRadius: 12,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanAnotherText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
});
