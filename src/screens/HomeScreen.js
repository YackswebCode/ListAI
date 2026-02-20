// src/screens/HomeScreen.js
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Button from '../components/Button';
import { getAllListings } from '../utils/database';
import { COLORS, SIZES } from '../utils/theme';

const TAB_BAR_HEIGHT = 65; // match your bottom tab height
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function HomeScreen({ navigation, route }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        setLoading(true);
        const listings = await getAllListings();
        if (!listings || listings.length === 0) {
          Alert.alert('Info', 'No listings found.');
        }
        setHistory(listings.slice(0, 4));
        setLoading(false);
      };
      loadData();
    }, [])
  );

  const openListing = (item) => {
    setSelected(item);
    setModalVisible(true);
  };

  const closeModal = () => {
    setSelected(null);
    setModalVisible(false);
  };

  const escapeCSV = (value) => {
    if (!value) return '';
    const stringValue = String(value);
    if (/[",\n]/.test(stringValue)) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  const exportToCSV = async () => {
    if (!selected) return;

    try {
      const headers = [
        'Title',
        'Platform',
        'Price',
        'Description',
        'Keywords',
        'Additional Info',
        'Created At',
      ];

      const keywords = Array.isArray(selected.keywords)
        ? selected.keywords.join('; ')
        : JSON.parse(selected.keywords || '[]').join('; ');

      const row = [
        escapeCSV(selected.title),
        escapeCSV(selected.platform),
        escapeCSV(selected.price),
        escapeCSV(selected.description),
        escapeCSV(keywords),
        escapeCSV(selected.additionalinfo),
        escapeCSV(new Date(selected.createdat).toLocaleString()),
      ];

      const csvString = headers.join(',') + '\n' + row.join(',');
      const fileName = `listing_${selected.id}.csv`;
      const fileUri = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, csvString, { encoding: 'utf8' });

      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Error', 'Sharing is not available on this device');
        return;
      }

      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: 'Export Listing',
        UTI: 'public.comma-separated-values-text',
      });
    } catch (err) {
      console.error('Export error:', err);
      Alert.alert('Export Failed', 'Could not save CSV file.');
    }
  };

  const renderListingItem = ({ item }) => (
    <TouchableOpacity style={styles.listingCard} onPress={() => openListing(item)}>
      <View style={styles.listingContent}>
        <Text style={styles.listingTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.listingPlatform}>{item.platform}</Text>
        <Text style={styles.listingPrice}>{item.price ? `${item.price}` : ''}</Text>
        <Text style={styles.listingDate}>{new Date(item.createdat).toLocaleString()}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.text} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={styles.container}>
        <View style={styles.logoSection}>
          <Image source={require('../../assets/icon.png')} style={styles.logo} />
        </View>

        <View style={styles.quickActions}>
          <Button
            title="Upload Image"
            onPress={() => navigation.navigate('AIListing', { mode: 'upload' })}
            style={styles.actionButton}
            textStyle={styles.actionButtonText}
          />
          <Button
            title="Generate Listing"
            onPress={() => navigation.navigate('AIListing', { mode: 'generate' })}
            style={[styles.actionButton, styles.secondaryButton]}
            textStyle={styles.actionButtonText}
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Listings</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Listings')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : history.length === 0 ? (
          <View style={styles.centerContent}>
            <Ionicons name="images-outline" size={64} color={COLORS.border} />
            <Text style={styles.emptyText}>No listings yet</Text>
          </View>
        ) : (
          <FlatList
            data={history}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderListingItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        )}

        {/* Responsive Listing Modal */}
        <Modal
          visible={modalVisible}
          animationType="fade"
          transparent
          onRequestClose={closeModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.responsiveModal}>
              <ScrollView contentContainerStyle={styles.modalContent}>
                <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                  <Text style={styles.closeText}>✕ Close</Text>
                </TouchableOpacity>

                {selected && (
                  <>
                    <Text style={styles.modalTitle}>{selected.title}</Text>
                    <Text style={styles.modalPlatform}>{selected.platform}</Text>

                    <Text style={styles.modalLabel}>Price</Text>
                    <Text style={styles.modalText}>{selected.price ? `${selected.price}` : '—'}</Text>

                    <Text style={styles.modalLabel}>Description</Text>
                    <Text style={styles.modalText}>{selected.description}</Text>

                    <Text style={styles.modalLabel}>Keywords</Text>
                    <View style={styles.keywordsContainer}>
                      {Array.isArray(selected.keywords)
                        ? selected.keywords.map((kw, idx) => (
                            <View key={idx} style={styles.keywordTag}>
                              <Text style={styles.keywordText}>{kw}</Text>
                            </View>
                          ))
                        : selected.keywords &&
                          JSON.parse(selected.keywords).map((kw, idx) => (
                            <View key={idx} style={styles.keywordTag}>
                              <Text style={styles.keywordText}>{kw}</Text>
                            </View>
                          ))}
                    </View>

                    <TouchableOpacity style={styles.downloadButton} onPress={exportToCSV}>
                      <Text style={styles.downloadButtonText}>📥 Share File</Text>
                    </TouchableOpacity>
                  </>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, paddingTop: 5, backgroundColor: COLORS.background },
  container: { flex: 1, paddingHorizontal: SIZES.screenPadding, paddingTop: 10 },
  logoSection: { alignItems: 'center', marginBottom: 24 },
  logo: { width: 80, height: 80, borderRadius: 20 },
  quickActions: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28 },
  actionButton: { flex: 1, marginHorizontal: 6, backgroundColor: COLORS.primary, borderRadius: SIZES.buttonRadius, paddingVertical: 14, alignItems: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 4 },
  secondaryButton: { backgroundColor: COLORS.accent, shadowColor: COLORS.accent },
  actionButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  seeAll: { fontSize: 14, color: COLORS.primary, fontWeight: '500' },
  listContainer: { paddingBottom: 20 },
  listingCard: { flexDirection: 'row', backgroundColor: COLORS.card, borderRadius: SIZES.cardRadius, padding: 12, marginBottom: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  listingContent: { flex: 1, marginRight: 8 },
  listingTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  listingPlatform: { fontSize: 14, color: COLORS.primary, marginBottom: 4 },
  listingPrice: { fontSize: 14, fontWeight: '700', color: COLORS.success, marginBottom: 4 },
  listingDate: { fontSize: 12, color: COLORS.text + '80' },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 60 },
  emptyText: { fontSize: 16, color: COLORS.text + '80' },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  responsiveModal: {
    width: '100%',
    maxHeight: SCREEN_HEIGHT * 0.8,
    backgroundColor: COLORS.background,
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalContent: { padding: 16 },
  closeButton: { padding: 12, backgroundColor: COLORS.primary, alignItems: 'center' },
  closeText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  modalPlatform: { fontSize: 16, color: COLORS.primary, marginBottom: 6 },
  modalLabel: { fontSize: 14, fontWeight: '600', color: COLORS.primary, marginTop: 12 },
  modalText: { fontSize: 14, color: COLORS.text, lineHeight: 20, marginTop: 4 },
  keywordsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 },
  keywordTag: { backgroundColor: COLORS.primary + '20', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 5, marginRight: 8, marginBottom: 8 },
  keywordText: { fontSize: 12, color: COLORS.primary },
  downloadButton: { backgroundColor: COLORS.success, borderRadius: SIZES.buttonRadius, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  downloadButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});