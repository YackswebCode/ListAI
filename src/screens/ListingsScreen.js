// src/screens/ListingsScreen.js
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { getAllListings } from '../utils/database'; // <-- import from database.js
import { COLORS, SIZES } from '../utils/theme';

export default function ListingsScreen() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Load listings on mount
  useEffect(() => {
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
  }, []);

  const openListing = (item) => {
    setSelected(item);
    setModalVisible(true);
  };

  const closeModal = () => {
    setSelected(null);
    setModalVisible(false);
  };

  const renderCard = ({ item }) => {
    const imageUri = item.imagepath ? `https://listai-backend.onrender.com${item.imagepath}` : null;

    return (
      <TouchableOpacity style={styles.card} onPress={() => openListing(item)}>
        {imageUri && (
          <Image
            source={{ uri: imageUri }}
            style={styles.cardImage}
            resizeMode="cover"
          />
        )}
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardPlatform}>{item.platform}</Text>
          <Text style={styles.cardPrice}>{item.price ? `${item.price}` : ''}</Text>
          <Text style={styles.cardDate}>{new Date(item.createdat).toLocaleString()}</Text>
        </View>
      </TouchableOpacity>
    );
  };

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

      {/* Full Listing Modal */}
      <Modal visible={modalVisible} animationType="slide" onRequestClose={closeModal}>
        <ScrollView style={styles.modalContainer}>
          <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
            <Text style={styles.closeText}>✕ Close</Text>
          </TouchableOpacity>

          {selected && (
            <>
              {selected.imagepath && (
                <Image
                  source={{ uri: `https://listai-backend.onrender.com${selected.imagepath}` }}
                  style={styles.modalImage}
                  resizeMode="cover"
                />
              )}

              <View style={styles.modalContent}>
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
                    : JSON.parse(selected.keywords || '[]').map((kw, idx) => (
                        <View key={idx} style={styles.keywordTag}>
                          <Text style={styles.keywordText}>{kw}</Text>
                        </View>
                      ))}
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </Modal>
    </View>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  listContent: { padding: SIZES.screenPadding },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.cardRadius,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardImage: { width: '100%', height: 180, borderRadius: 12, marginTop: 8 },
  cardContent: { padding: 12 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  cardPlatform: { fontSize: 14, color: COLORS.primary, marginBottom: 4 },
  cardPrice: { fontSize: 16, fontWeight: '700', color: COLORS.success, marginBottom: 4 },
  cardDate: { fontSize: 12, color: COLORS.text + '80' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: COLORS.text + '80', fontSize: 16 },

  modalContainer: { flex: 1, backgroundColor: COLORS.background },
  closeButton: { padding: 12, backgroundColor: COLORS.primary, alignItems: 'center' },
  closeText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  modalImage: { width: '100%', height: 250, marginTop: 12, borderRadius: 12 },
  modalContent: { padding: 16 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  modalPlatform: { fontSize: 16, color: COLORS.primary, marginBottom: 6 },
  modalLabel: { fontSize: 14, fontWeight: '600', color: COLORS.primary, marginTop: 12 },
  modalText: { fontSize: 14, color: COLORS.text, lineHeight: 20, marginTop: 4 },
  keywordsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 },
  keywordTag: {
    backgroundColor: COLORS.primary + '20',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 8,
    marginBottom: 8,
  },
  keywordText: { fontSize: 12, color: COLORS.primary },
});
