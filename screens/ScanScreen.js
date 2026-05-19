import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppContext } from '../utils/appContext';
import { detectLanguage } from '../utils/languageDetector';
import { extractText } from '../utils/ocrRouter';
import { preprocessImage } from '../utils/imagePreprocessor';
import { GOOGLE_VISION_API_KEY } from '../utils/googleVisionApi';
import { useTheme } from '../utils/theme';

const SCAN_BOX_HEIGHT = 292;
const OCR_MODES = ['auto', 'handwritten', 'printed'];

export default function ScanScreen({ navigation }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { settings, updateSettings } = useContext(AppContext);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [cameraVisible, setCameraVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState('');
  const [processing, setProcessing] = useState(false);
  const [processingLabel, setProcessingLabel] = useState('');
  const [scanLine] = useState(() => new Animated.Value(0));
  const cameraRef = useRef(null);

  const ocrMode = settings.ocrMode || 'auto';

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLine, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(scanLine, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [scanLine]);

    const translateY = useMemo(
      () => scanLine.interpolate({
        inputRange: [0, 1],
        outputRange: [18, SCAN_BOX_HEIGHT - 34],
      }),
      [scanLine],
    );

    const viewfinderHint = useMemo(() => {
      if (ocrMode === 'handwritten') {
        return 'Align handwritten code within the frame';
      }

      if (ocrMode === 'printed') {
        return 'Align printed code within the frame';
      }

      return 'Align code within the frame';
    }, [ocrMode]);

    const cycleOcrMode = () => {
      const currentIndex = OCR_MODES.indexOf(ocrMode);
      const nextMode = OCR_MODES[(currentIndex + 1) % OCR_MODES.length];
      updateSettings({ ocrMode: nextMode });
    };

    const openCamera = async () => {
      const permission = cameraPermission?.granted ? cameraPermission : await requestCameraPermission();

      if (!permission?.granted) {
        Alert.alert('Camera permission needed', 'Enable camera access to capture a code image.');
        return;
      }

      setCameraVisible(true);
    };

    const openGallery = async () => {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert('Gallery permission needed', 'Enable photo access to choose a code image.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        allowsEditing: false,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      setSelectedImageUri(result.assets[0].uri);
    };

    const capturePhoto = async () => {
      if (!cameraRef.current) {
        return;
      }

      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 1, skipProcessing: true });

        if (photo?.uri) {
          setSelectedImageUri(photo.uri);
        }

        setCameraVisible(false);
      } catch (error) {
        Alert.alert('Capture failed', 'SnapScript could not take the photo.');
      }
    };

    const scanSelectedImage = async () => {
      if (!selectedImageUri) {
        Alert.alert('Select an image first', 'Use Camera or Gallery before scanning.');
        return;
      }

      setProcessing(true);
      setProcessingLabel('Processing image...');

      try {
        const processedImage = await preprocessImage(selectedImageUri);
        setProcessingLabel('Extracting code...');

        const extraction = await extractText(processedImage, GOOGLE_VISION_API_KEY, ocrMode);
        const ocrText = String(extraction?.text || '').trim();

        if (!ocrText) {
          Alert.alert('No code detected', 'Use a clearer image with the code centered in the frame.');
          return;
        }

        const detectedLanguage = detectLanguage(ocrText);

        navigation.navigate('Result', {
          ocrText,
          detectedLanguage,
          ocrType: extraction.type,
          ocrConfidence: extraction.confidence,
        });
      } catch (error) {
        Alert.alert('Scan failed', 'SnapScript could not process the selected image.');
      } finally {
        setProcessing(false);
        setProcessingLabel('');
      }
    };

    return (
      <View style={[styles.screen, { backgroundColor: theme.BACKGROUND }]}> 
        <View style={[styles.topBar, { backgroundColor: theme.PRIMARY, paddingTop: insets.top + 14 }]}> 
          <Pressable hitSlop={12} onPress={() => navigation.navigate('Settings')}>
            <Ionicons name="menu" size={22} color={theme.ON_PRIMARY} />
          </Pressable>
          <Text style={[styles.topTitle, { color: theme.ON_PRIMARY }]}>SnapScript</Text>
          <Ionicons name="flash" size={22} color={theme.ON_PRIMARY} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Pressable
            style={[styles.modePill, ocrMode === 'auto' ? styles.modePillGhost : styles.modePillActive, { backgroundColor: ocrMode === 'auto' ? theme.PILL_GHOST_BG : theme.PILL_ACTIVE_BG, borderColor: ocrMode === 'auto' ? theme.PILL_GHOST_BORDER : theme.PILL_ACTIVE_BG }]}
            onPress={cycleOcrMode}
          >
            <Ionicons name="sparkles-outline" size={16} color={ocrMode === 'auto' ? theme.PILL_GHOST_TEXT : theme.PILL_ACTIVE_TEXT} />
            <Text style={[styles.modePillText, { color: ocrMode === 'auto' ? theme.PILL_GHOST_TEXT : theme.PILL_ACTIVE_TEXT }]}>
              {ocrMode === 'auto' ? 'Auto-Detect Mode' : ocrMode === 'handwritten' ? 'Handwritten Mode' : 'Printed Mode'}
            </Text>
          </Pressable>

          <View style={[styles.languageCard, { backgroundColor: theme.CARD_BG, borderColor: theme.CARD_BORDER }]}> 
            <View style={styles.languageLeft}>
              <View style={[styles.languageIconWrap, { backgroundColor: theme.ICON_BADGE_PURPLE }]}> 
                <Text style={[styles.languageIconText, { color: theme.ICON_COLOR_PURPLE }]}>{'</>'}</Text>
              </View>
              <View>
                <Text style={[styles.languageLabel, { color: theme.TEXT_MUTED }]}>Language</Text>
                <Text style={[styles.languageValue, { color: theme.TEXT_PRIMARY }]}>Auto-Detect</Text>
              </View>
            </View>
            <View style={[styles.languageChip, { backgroundColor: theme.PILL_GHOST_BG, borderColor: theme.PILL_GHOST_BORDER }]}> 
              <Ionicons name="lock-closed-outline" size={13} color={theme.PILL_GHOST_TEXT} />
              <Text style={[styles.languageChipText, { color: theme.PILL_GHOST_TEXT }]}>Read Only</Text>
            </View>
          </View>

          <View style={[styles.previewCard, { backgroundColor: theme.CARD_BG, borderColor: theme.CARD_BORDER }]}> 
            <View style={styles.previewHeader}>
              <View style={[styles.previewBadge, { backgroundColor: theme.ICON_BADGE_BLUE }]}> 
                <Ionicons name="camera-outline" size={14} color={theme.ICON_COLOR_BLUE} />
              </View>
              <View style={styles.previewHeaderTextWrap}>
                <Text style={[styles.previewTitle, { color: theme.TEXT_PRIMARY }]}>{selectedImageUri ? 'Photo ready' : 'Capture a photo'}</Text>
                <Text style={[styles.previewSubtitle, { color: theme.TEXT_MUTED }]}>{selectedImageUri ? 'Review the picture, then scan or retake it.' : 'Take a picture of the code to preview it here first.'}</Text>
              </View>
            </View>

            <View style={[styles.previewFrame, { backgroundColor: theme.IDE_HEADER, borderColor: theme.CARD_BORDER }]}> 
              {selectedImageUri ? (
                <Image source={{ uri: selectedImageUri }} style={styles.previewImage} resizeMode="cover" />
              ) : (
                <View style={styles.previewEmptyState}>
                  <Ionicons name="image-outline" size={32} color={theme.TEXT_HINT} />
                  <Text style={[styles.previewEmptyTitle, { color: theme.TEXT_PRIMARY }]}>No photo yet</Text>
                  <Text style={[styles.previewEmptyText, { color: theme.TEXT_MUTED }]}>Capture a code image to see it here before scanning.</Text>
                </View>
              )}
            </View>

            <View style={styles.previewActions}>
              <Pressable
                style={[styles.previewActionButton, { backgroundColor: theme.GHOST_BG, borderColor: theme.GHOST_BORDER }]}
                onPress={() => setSelectedImageUri('')}
                disabled={!selectedImageUri}
              >
                <Ionicons name="refresh-outline" size={16} color={selectedImageUri ? theme.PRIMARY : theme.TEXT_HINT} />
                <Text style={[styles.previewActionText, { color: selectedImageUri ? theme.PRIMARY : theme.TEXT_HINT }]}>Retake</Text>
              </Pressable>
              <Pressable
                style={[styles.previewActionButton, { backgroundColor: theme.PRIMARY, borderColor: theme.PRIMARY }]}
                onPress={scanSelectedImage}
                disabled={!selectedImageUri || processing}
              >
                <Ionicons name="scan-outline" size={16} color={theme.ON_PRIMARY} />
                <Text style={[styles.previewActionText, { color: theme.ON_PRIMARY }]}>Scan now</Text>
              </Pressable>
            </View>
          </View>

          <View style={[styles.viewfinder, { height: SCAN_BOX_HEIGHT, backgroundColor: theme.IDE_BG }]}> 
            <View style={styles.viewfinderInner}>
              <View style={[styles.cornerTopLeft, { borderColor: theme.ON_PRIMARY }]} />
              <View style={[styles.cornerTopRight, { borderColor: theme.ON_PRIMARY }]} />
              <View style={[styles.cornerBottomLeft, { borderColor: theme.ON_PRIMARY }]} />
              <View style={[styles.cornerBottomRight, { borderColor: theme.ON_PRIMARY }]} />
              <Animated.View style={[styles.scanLine, { backgroundColor: theme.ON_PRIMARY, transform: [{ translateY }] }]} />
              <Text style={[styles.viewfinderHint, { color: theme.TEXT_HINT }]}>{viewfinderHint}</Text>
            </View>
          </View>

          <View style={styles.rowButtons}>
            <Pressable style={[styles.ghostButton, { backgroundColor: theme.GHOST_BG, borderColor: theme.GHOST_BORDER }]} onPress={openCamera}>
              <Ionicons name="camera-outline" size={18} color={theme.PRIMARY} />
              <Text style={[styles.ghostButtonText, { color: theme.PRIMARY }]}>Camera</Text>
            </Pressable>
            <Pressable style={[styles.ghostButton, { backgroundColor: theme.GHOST_BG, borderColor: theme.GHOST_BORDER }]} onPress={openGallery}>
              <Ionicons name="image-outline" size={18} color={theme.PRIMARY} />
              <Text style={[styles.ghostButtonText, { color: theme.PRIMARY }]}>Gallery</Text>
            </Pressable>
          </View>

          <Pressable
            style={[styles.primaryButton, { backgroundColor: theme.PRIMARY }]}
            onPress={scanSelectedImage}
            disabled={processing}
          >
            {processing ? <ActivityIndicator color={theme.ON_PRIMARY} /> : <Ionicons name="scan-outline" size={18} color={theme.ON_PRIMARY} />}
            <Text style={[styles.primaryButtonText, { color: theme.ON_PRIMARY }]}>SCAN CODE</Text>
          </Pressable>
        </ScrollView>

        <Modal visible={processing} transparent animationType="fade" onRequestClose={() => setProcessing(false)}>
          <View style={[styles.processingOverlay, { backgroundColor: theme.SCRIM_STRONG }]}>
            <View style={[styles.processingCard, { backgroundColor: theme.CARD_BG, borderColor: theme.CARD_BORDER }]}> 
              <ActivityIndicator size="large" color={theme.PRIMARY} />
              <Text style={[styles.processingText, { color: theme.TEXT_PRIMARY }]}>{processingLabel || 'Processing image...'}</Text>
            </View>
          </View>
        </Modal>

        <Modal visible={cameraVisible} animationType="slide" onRequestClose={() => setCameraVisible(false)}>
          <View style={[styles.cameraScreen, { backgroundColor: theme.IDE_BG }]}> 
            <CameraView ref={cameraRef} style={StyleSheet.absoluteFillObject} facing="back" />
            <View style={[styles.cameraOverlay, { backgroundColor: theme.SCRIM }]}>
              <View style={styles.cameraTopBar}>
                <Pressable onPress={() => setCameraVisible(false)} hitSlop={12}>
                  <Ionicons name="close" size={24} color={theme.ON_PRIMARY} />
                </Pressable>
                <Text style={[styles.cameraTitle, { color: theme.ON_PRIMARY }]}>Capture code</Text>
                <View style={{ width: 24 }} />
              </View>

              <View style={[styles.cameraFrame, { borderColor: theme.ON_PRIMARY }]}> 
                <View style={[styles.cameraCornerTopLeft, { borderColor: theme.ON_PRIMARY }]} />
                <View style={[styles.cameraCornerTopRight, { borderColor: theme.ON_PRIMARY }]} />
                <View style={[styles.cameraCornerBottomLeft, { borderColor: theme.ON_PRIMARY }]} />
                <View style={[styles.cameraCornerBottomRight, { borderColor: theme.ON_PRIMARY }]} />
              </View>

              <Text style={[styles.cameraHint, { color: theme.TEXT_HINT }]}>Place the code inside the frame and capture.</Text>

              <View style={styles.cameraActions}>
                <Pressable style={styles.cameraActionButton} onPress={() => setCameraVisible(false)}>
                  <Text style={[styles.cameraActionText, { color: theme.ON_PRIMARY }]}>Cancel</Text>
                </Pressable>
                <Pressable style={[styles.cameraCaptureButton, { borderColor: theme.ON_PRIMARY }]} onPress={capturePhoto}>
                  <View style={[styles.cameraCaptureInner, { backgroundColor: theme.ON_PRIMARY }]} />
                </Pressable>
                <View style={styles.cameraActionButtonSpacer} />
              </View>
            </View>
          </View>
        </Modal>
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
    topTitle: {
      flex: 1,
      textAlign: 'center',
      fontSize: 20,
      fontWeight: '800',
      letterSpacing: 0.2,
    },
    content: {
      padding: 16,
      gap: 14,
      paddingBottom: 24,
    },
    modePill: {
      minHeight: 38,
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 14,
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    modePillGhost: {
      borderStyle: 'solid',
    },
    modePillActive: {
      borderStyle: 'solid',
    },
    modePillText: {
      fontSize: 13,
      fontWeight: '800',
    },
    languageCard: {
      borderWidth: 1,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    languageLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    languageIconWrap: {
      width: 38,
      height: 38,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    languageIconText: {
      fontSize: 16,
      fontWeight: '800',
    },
    languageLabel: {
      fontSize: 12,
      fontWeight: '700',
    },
    languageValue: {
      fontSize: 16,
      fontWeight: '800',
      marginTop: 2,
    },
    languageChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderWidth: 1,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    languageChipText: {
      fontSize: 11,
      fontWeight: '700',
    },
    previewCard: {
      borderWidth: 1,
      borderRadius: 18,
      padding: 14,
      gap: 12,
    },
    previewHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    previewBadge: {
      width: 34,
      height: 34,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    previewHeaderTextWrap: {
      flex: 1,
      gap: 2,
    },
    previewTitle: {
      fontSize: 15,
      fontWeight: '800',
    },
    previewSubtitle: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '500',
    },
    previewFrame: {
      minHeight: 190,
      borderWidth: 1,
      borderRadius: 16,
      overflow: 'hidden',
    },
    previewImage: {
      width: '100%',
      height: 190,
    },
    previewEmptyState: {
      minHeight: 190,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 18,
      gap: 8,
    },
    previewEmptyTitle: {
      fontSize: 14,
      fontWeight: '800',
    },
    previewEmptyText: {
      fontSize: 12,
      lineHeight: 17,
      textAlign: 'center',
      fontWeight: '500',
    },
    previewActions: {
      flexDirection: 'row',
      gap: 12,
    },
    previewActionButton: {
      flex: 1,
      minHeight: 48,
      borderWidth: 1,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    previewActionText: {
      fontSize: 14,
      fontWeight: '800',
    },
    viewfinder: {
      borderRadius: 20,
      overflow: 'hidden',
    },
    viewfinderInner: {
      flex: 1,
      position: 'relative',
      justifyContent: 'center',
      alignItems: 'center',
    },
    cornerTopLeft: {
      position: 'absolute',
      top: 18,
      left: 18,
      width: 20,
      height: 20,
      borderTopWidth: 2.5,
      borderLeftWidth: 2.5,
    },
    cornerTopRight: {
      position: 'absolute',
      top: 18,
      right: 18,
      width: 20,
      height: 20,
      borderTopWidth: 2.5,
      borderRightWidth: 2.5,
    },
    cornerBottomLeft: {
      position: 'absolute',
      bottom: 34,
      left: 18,
      width: 20,
      height: 20,
      borderBottomWidth: 2.5,
      borderLeftWidth: 2.5,
    },
    cornerBottomRight: {
      position: 'absolute',
      bottom: 34,
      right: 18,
      width: 20,
      height: 20,
      borderBottomWidth: 2.5,
      borderRightWidth: 2.5,
    },
    scanLine: {
      position: 'absolute',
      left: 18,
      right: 18,
      height: 2,
      borderRadius: 999,
    },
    viewfinderHint: {
      position: 'absolute',
      bottom: 16,
      fontSize: 13,
      fontWeight: '600',
      textAlign: 'center',
    },
    rowButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    ghostButton: {
      flex: 1,
      borderWidth: 1,
      borderRadius: 10,
      minHeight: 52,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      flexDirection: 'row',
    },
    ghostButtonText: {
      fontSize: 15,
      fontWeight: '800',
    },
    primaryButton: {
      minHeight: 54,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 10,
    },
    primaryButtonText: {
      fontSize: 15,
      fontWeight: '900',
      letterSpacing: 0.4,
    },
    processingOverlay: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    processingCard: {
      width: '100%',
      maxWidth: 320,
      borderWidth: 1,
      borderRadius: 18,
      paddingVertical: 22,
      paddingHorizontal: 20,
      alignItems: 'center',
      gap: 14,
    },
    processingText: {
      fontSize: 15,
      fontWeight: '800',
    },
    cameraScreen: {
      flex: 1,
    },
    cameraOverlay: {
      flex: 1,
      paddingHorizontal: 18,
      paddingTop: 18,
      paddingBottom: 32,
    },
    cameraTopBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    cameraTitle: {
      fontSize: 17,
      fontWeight: '800',
    },
    cameraFrame: {
      flex: 1,
      marginTop: 24,
      marginBottom: 16,
      borderWidth: 2,
      borderRadius: 24,
    },
    cameraCornerTopLeft: {
      position: 'absolute',
      top: 20,
      left: 20,
      width: 24,
      height: 24,
      borderTopWidth: 3,
      borderLeftWidth: 3,
    },
    cameraCornerTopRight: {
      position: 'absolute',
      top: 20,
      right: 20,
      width: 24,
      height: 24,
      borderTopWidth: 3,
      borderRightWidth: 3,
    },
    cameraCornerBottomLeft: {
      position: 'absolute',
      bottom: 20,
      left: 20,
      width: 24,
      height: 24,
      borderBottomWidth: 3,
      borderLeftWidth: 3,
    },
    cameraCornerBottomRight: {
      position: 'absolute',
      bottom: 20,
      right: 20,
      width: 24,
      height: 24,
      borderBottomWidth: 3,
      borderRightWidth: 3,
    },
    cameraHint: {
      textAlign: 'center',
      fontSize: 13,
      marginBottom: 20,
    },
    cameraActions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    cameraActionButton: {
      minWidth: 72,
      minHeight: 44,
      justifyContent: 'center',
    },
    cameraActionText: {
      fontSize: 15,
      fontWeight: '700',
    },
    cameraActionButtonSpacer: {
      minWidth: 72,
    },
    cameraCaptureButton: {
      width: 74,
      height: 74,
      borderRadius: 37,
      borderWidth: 4,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cameraCaptureInner: {
      width: 54,
      height: 54,
      borderRadius: 27,
    },
  });
