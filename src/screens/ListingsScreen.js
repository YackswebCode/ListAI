// src/screens/ListingsScreen.js
import { useFocusEffect } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { getAllListings } from '../utils/database';
import { COLORS, SIZES } from '../utils/theme';

const TAB_BAR_HEIGHT = 65;
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ListingsScreen() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const loadListings = async () => {
        setLoading(true);
        const data = await getAllListings();
        if (!data || data.length === 0) {
          Alert.alert('Info', 'No listings found.');
        }
        setListings(data);
        setLoading(false);
      };
      loadListings();
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

  const renderCard = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => openListing(item)}>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardPlatform}>{item.platform}</Text>
        <Text style={styles.cardPrice}>{item.price ? `${item.price}` : ''}</Text>
        <Text style={styles.cardDate}>
          {new Date(item.createdat).toLocaleString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : listings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No listings yet.</Text>
        </View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderCard}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* ✅ Responsive Modal */}
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
                  <Text style={styles.modalText}>{selected.price || '—'}</Text>

                  <Text style={styles.modalLabel}>Description</Text>
                  <Text style={styles.modalText}>{selected.description}</Text>

                  <Text style={styles.modalLabel}>Keywords</Text>
                  <View style={styles.keywordsContainer}>
                    {(Array.isArray(selected.keywords)
                      ? selected.keywords
                      : JSON.parse(selected.keywords || '[]')
                    ).map((kw, idx) => (
                      <View key={idx} style={styles.keywordTag}>
                        <Text style={styles.keywordText}>{kw}</Text>
                      </View>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={styles.downloadButton}
                    onPress={exportToCSV}
                  >
                    <Text style={styles.downloadButtonText}>
                      📥 Share File
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 15,
    backgroundColor: COLORS.background,
  },

  listContent: { padding: SIZES.screenPadding },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.cardRadius,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  cardContent: { padding: 12 },

  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },

  cardPlatform: {
    fontSize: 14,
    color: COLORS.primary,
    marginBottom: 4,
  },

  cardPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.success,
    marginBottom: 4,
  },

  cardDate: { fontSize: 12, color: COLORS.text + '80' },

  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: COLORS.text + '80', fontSize: 16 },

  // ✅ Modal Styles
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

  closeButton: {
    padding: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },

  closeText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },

  modalPlatform: {
    fontSize: 16,
    color: COLORS.primary,
    marginBottom: 6,
  },

  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 12,
  },

  modalText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
    marginTop: 4,
  },

  keywordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
  },

  keywordTag: {
    backgroundColor: COLORS.primary + '20',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 8,
    marginBottom: 8,
  },

  keywordText: { fontSize: 12, color: COLORS.primary },

  downloadButton: {
    backgroundColor: COLORS.success,
    borderRadius: SIZES.buttonRadius,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },

  downloadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});