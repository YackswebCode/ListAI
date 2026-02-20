import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Button from '../components/Button';
import { saveListing } from '../utils/database';
import { generateListingFromImage } from '../utils/gemini';
import { COLORS, SIZES } from '../utils/theme';

const PLATFORMS = [
  { label: 'eBay', value: 'eBay' },
  { label: 'Etsy', value: 'Etsy' },
  { label: 'Poshmark', value: 'Poshmark' },
  { label: 'Mercari', value: 'Mercari' },
  { label: 'Depop', value: 'Depop' },
  { label: 'Other', value: 'Other' },
];

export default function AIListingScreen({ route, navigation }) {
  const { mode } = route?.params || {};
  const [imageUri, setImageUri] = useState(null);
  const [platform, setPlatform] = useState('eBay');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [generated, setGenerated] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // --- Permissions ---
  const requestMediaLibraryPermissions = async () => {
    if (Platform.OS === 'web') return true;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'We need access to your photos.');
      return false;
    }
    return true;
  };

  const requestCameraPermissions = async () => {
    if (Platform.OS === 'web') return false;
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'We need access to your camera.');
      return false;
    }
    return true;
  };

  // --- Image Selection ---
  const pickImage = async () => {
    const ok = await requestMediaLibraryPermissions();
    if (!ok) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled) setImageUri(result.assets[0].uri);
    } catch (err) {
      console.error('pickImage error', err);
      Alert.alert('Error', 'Could not open image library.');
    }
  };

  const takePhoto = async () => {
    const ok = await requestCameraPermissions();
    if (!ok) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled) setImageUri(result.assets[0].uri);
    } catch (err) {
      console.error('takePhoto error', err);
      Alert.alert('Error', 'Could not open camera.');
    }
  };

  // --- Generate Listing ---
  const handleGenerate = async () => {
    if (!imageUri) {
      Alert.alert('No Image', 'Please select or take an image first.');
      return;
    }

    setLoading(true);
    setGenerated(null);

    try {
      const result = await generateListingFromImage(imageUri, { platform, additionalInfo });
      setGenerated(result);
    } catch (err) {
      console.error('Generation error', err);
      Alert.alert('Generation Failed', err?.message || 'AI generation failed.');
    } finally {
      setLoading(false);
    }
  };

  // --- Save Listing ---
  const handleSave = async () => {
    if (!generated) {
      Alert.alert('Nothing to save', 'Please generate a listing first.');
      return;
    }
    if (saving) return;

    setSaving(true);
    try {
      const payload = {
        title: generated.title || '',
        price: generated.price || '',
        description: generated.description || '',
        keywords: generated.keywords || [],
        platform,
        additionalInfo,
        imageUri: imageUri || null,
      };

      await saveListing(payload);
      Alert.alert('Success', 'Listing saved successfully.');

      setImageUri(null);
      setGenerated(null);
      setAdditionalInfo('');
      setPlatform('eBay');
    } catch (err) {
      console.error('Save error', err);
      Alert.alert('Save Failed', err?.message || 'Could not save listing.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setImageUri(null);
    setGenerated(null);
    setAdditionalInfo('');
    setPlatform('eBay');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>AI Listing Generator</Text>

      {/* Image Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Select Product Image</Text>
        {imageUri ? (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
            <TouchableOpacity onPress={() => setImageUri(null)} style={styles.removeImage}>
              <Text style={styles.removeImageText}>✕</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.imageButtons}>
            <Button title="📷 Take Photo" onPress={takePhoto} style={styles.imageButton} />
            <Button title="🖼️ Choose from Gallery" onPress={pickImage} style={styles.imageButton} />
          </View>
        )}
      </View>

      {/* Platform & Notes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. Platform & Extra Details</Text>
        <View style={styles.pickerContainer}>
          <Picker selectedValue={platform} onValueChange={setPlatform} style={styles.picker}>
            {PLATFORMS.map((p) => (
              <Picker.Item key={p.value} label={p.label} value={p.value} />
            ))}
          </Picker>
        </View>
        <TextInput
          style={styles.textInput}
          placeholder="Additional notes (condition, brand, etc.)"
          value={additionalInfo}
          onChangeText={setAdditionalInfo}
          multiline
        />
      </View>

      {!generated && (
        <Button
          title={loading ? 'Generating...' : '🚀 Generate Listing'}
          onPress={handleGenerate}
          disabled={loading || !imageUri}
          style={styles.generateButton}
        />
      )}

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>AI is analyzing your image...</Text>
        </View>
      )}

      {generated && !loading && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Generated Listing</Text>
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>Title</Text>
            <Text style={styles.resultText}>{generated.title}</Text>

            <Text style={styles.resultLabel}>Price</Text>
            <Text style={styles.resultText}>{generated.price || '—'}</Text>

            <Text style={styles.resultLabel}>Description</Text>
            <Text style={styles.resultText}>{generated.description}</Text>

            <Text style={styles.resultLabel}>Keywords</Text>
            <View style={styles.keywordsContainer}>
              {generated.keywords.map((keyword, index) => (
                <View key={index} style={styles.keywordTag}>
                  <Text style={styles.keywordText}>{keyword}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.resultLabel}>Suggested Category</Text>
            <Text style={styles.resultText}>{generated.category || '—'}</Text>
          </View>

          <View style={styles.actionButtons}>
            <Button
              title={saving ? 'Saving...' : '💾 Save to History'}
              onPress={handleSave}
              style={styles.saveButton}
              disabled={saving}
            />
            <Button title="🔄 Generate New" onPress={handleReset} style={styles.resetButton} />
          </View>
        </View>
      )}
    </ScrollView>
  );
}

// --- Styles (unchanged) ---
const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 15, backgroundColor: COLORS.background },
  contentContainer: { padding: SIZES.screenPadding, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.text, marginBottom: 20, textAlign: 'center' },
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 10 },
  imageButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  imageButton: { flex: 1, backgroundColor: COLORS.accent, borderWidth: 1, borderColor: COLORS.border, borderRadius: SIZES.buttonRadius, paddingVertical: 12, marginHorizontal: 4 },
  imagePreviewContainer: { alignItems: 'center', position: 'relative' },
  imagePreview: { width: '100%', height: 220, borderRadius: SIZES.cardRadius, borderWidth: 1, borderColor: COLORS.border },
  removeImage: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.5)', width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  removeImageText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  pickerContainer: { borderWidth: 1, borderColor: COLORS.border, borderRadius: SIZES.buttonRadius, backgroundColor: COLORS.card, marginBottom: 12 },
  picker: { height: 50, color: COLORS.text },
  textInput: { borderWidth: 1, borderColor: COLORS.border, borderRadius: SIZES.buttonRadius, backgroundColor: COLORS.card, padding: 12, color: COLORS.text, fontSize: 14, minHeight: 80 },
  generateButton: { backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: SIZES.buttonRadius, marginVertical: 20 },
  loadingContainer: { alignItems: 'center', marginVertical: 30 },
  loadingText: { marginTop: 12, fontSize: 16, color: COLORS.text, opacity: 0.7 },
  resultContainer: { marginTop: 20 },
  resultTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 15 },
  resultCard: { backgroundColor: COLORS.card, borderRadius: SIZES.cardRadius, padding: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 20 },
  resultLabel: { fontSize: 14, fontWeight: '600', color: COLORS.primary, marginTop: 12, marginBottom: 4 },
  resultText: { fontSize: 15, color: COLORS.text, lineHeight: 22 },
  actionButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  saveButton: { flex: 1, backgroundColor: COLORS.success, paddingVertical: 14, borderRadius: SIZES.buttonRadius, marginHorizontal: 4 },
  resetButton: { flex: 1, backgroundColor: COLORS.accent, borderWidth: 1, borderColor: COLORS.border, paddingVertical: 14, borderRadius: SIZES.buttonRadius, marginHorizontal: 4 },
  keywordsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 },
  keywordTag: { backgroundColor: COLORS.primary + '20', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 5, marginRight: 8, marginBottom: 8 },
  keywordText: { color: COLORS.primary, fontSize: 13, fontWeight: '500' },
});