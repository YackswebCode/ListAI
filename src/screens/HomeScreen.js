// src/screens/HomeScreen.js
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { getAllListings } from '../utils/database'; // <-- use database.js
import { COLORS, SIZES } from '../utils/theme';

export default function HomeScreen({ navigation, route }) {
  const user = route.params?.user || { name: 'Guest', email: '' };
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Load recent listings
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const listings = await getAllListings();
      if (!listings || listings.length === 0) {
        Alert.alert('Info', 'No listings found.');
      }
      setHistory(listings.slice(0, 4)); // only 4 on home
      setLoading(false);
    };
    loadData();
  }, []);

  const openListing = (item) => {
    setSelected(item);
    setModalVisible(true);
  };

  const closeModal = () => {
    setSelected(null);
    setModalVisible(false);
  };

  const renderListingItem = ({ item }) => {
    const imageUri = item.imagepath ? `https://listai-backend.onrender.com${item.imagepath}` : null;

    return (
      <TouchableOpacity style={styles.listingCard} onPress={() => openListing(item)}>
        {imageUri && (
          <Image
            source={{ uri: imageUri }}
            style={styles.listingImage}
            resizeMode="cover"
          />
        )}
        <View style={styles.listingContent}>
          <Text style={styles.listingTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.listingPlatform}>{item.platform}</Text>
          <Text style={styles.listingPrice}>{item.price ? `${item.price}` : ''}</Text>
          <Text style={styles.listingDate}>{new Date(item.createdat).toLocaleString()}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.text} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={styles.container}>
        {/* Profile Header */}
        <View style={styles.profileSection}>
          <Image source={require('../../assets/icon.png')} style={styles.avatar} />
          <View style={styles.profileText}>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{user.name}</Text>
          </View>
        </View>

        {/* Quick Actions */}
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

        {/* Recent Listings Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Listings</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Listings')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {/* Listings List */}
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

        {/* Listing Modal */}
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
                      : selected.keywords &&
                        JSON.parse(selected.keywords).map((kw, idx) => (
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
    </SafeAreaView>
  );
}

// --- Styles (unchanged) ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, paddingHorizontal: SIZES.screenPadding, paddingTop: 10 },
  profileSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  avatar: { width: 60, height: 60, borderRadius: 30, marginRight: 16, borderWidth: 2, borderColor: COLORS.primary },
  profileText: { flex: 1 },
  greeting: { fontSize: 14, color: COLORS.text, opacity: 0.6, marginBottom: 2 },
  userName: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  quickActions: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28 },
  actionButton: { flex: 1, marginHorizontal: 6, backgroundColor: COLORS.primary, borderRadius: SIZES.buttonRadius, paddingVertical: 14, alignItems: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 4 },
  secondaryButton: { backgroundColor: COLORS.accent, shadowColor: COLORS.accent },
  actionButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  seeAll: { fontSize: 14, color: COLORS.primary, fontWeight: '500' },
  listContainer: { paddingBottom: 20 },
  listingCard: { flexDirection: 'row', backgroundColor: COLORS.card, borderRadius: SIZES.cardRadius, padding: 12, marginBottom: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  listingImage: { width: 60, height: 60, borderRadius: 12, backgroundColor: COLORS.border },
  listingContent: { flex: 1, marginLeft: 12, marginRight: 8 },
  listingTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  listingPlatform: { fontSize: 14, color: COLORS.primary, marginBottom: 4 },
  listingPrice: { fontSize: 14, fontWeight: '700', color: COLORS.success, marginBottom: 4 },
  listingDate: { fontSize: 12, color: COLORS.text + '80' },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 60 },
  emptyText: { fontSize: 16, color: COLORS.text + '80' },
  modalContainer: { flex: 1, backgroundColor: COLORS.background },
  closeButton: { padding: 12, backgroundColor: COLORS.primary, alignItems: 'center' },
  closeText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  modalImage: { width: '100%', height: 250, marginTop: 12, borderRadius: 12 },
  modalContent: { padding: 16, paddingTop: 12 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  modalPlatform: { fontSize: 16, color: COLORS.primary, marginBottom: 6 },
  modalLabel: { fontSize: 14, fontWeight: '600', color: COLORS.primary, marginTop: 12 },
  modalText: { fontSize: 14, color: COLORS.text, lineHeight: 20, marginTop: 4 },
  keywordsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 },
  keywordTag: { backgroundColor: COLORS.primary + '20', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 5, marginRight: 8, marginBottom: 8 },
  keywordText: { fontSize: 12, color: COLORS.primary },
});
