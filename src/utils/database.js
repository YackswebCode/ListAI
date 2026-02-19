// src/utils/database.js
import { Platform } from 'react-native';

// <-- backend base URL (same as HomeScreen) -->
const BACKEND_URL = 'https://listai-backend.onrender.com';

/**
 * Upload image to backend
 * @param {string} uri - local image URI
 * @returns {Promise<string>} - returns the uploaded image path from backend
 */
export const uploadImage = async (uri) => {
  if (!uri) return null;

  try {
    const formData = new FormData();
    const filename = uri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image`;

    formData.append('image', {
      uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
      name: filename,
      type,
    });

    const response = await fetch(`${BACKEND_URL}/api/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Image upload failed');

    return data.path; // backend returns the image path
  } catch (err) {
    console.error('uploadImage error', err);
    throw err;
  }
};

/**
 * Save listing to backend
 * @param {Object} listing - listing data including imageUri, title, price, description, keywords, platform
 */
export const saveListing = async (listing) => {
  try {
    let uploadedImagePath = null;

    // Upload image if provided
    if (listing.imageUri) {
      uploadedImagePath = await uploadImage(listing.imageUri);
    }

    const payload = {
      title: listing.title,
      price: listing.price,
      description: listing.description,
      keywords: listing.keywords,
      platform: listing.platform,
      additionalInfo: listing.additionalInfo || '',
      imagepath: uploadedImagePath, // store backend path
    };

    const res = await fetch(`${BACKEND_URL}/api/listings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to save listing');

    return data;
  } catch (err) {
    console.error('saveListing error', err);
    throw err;
  }
};

/**
 * Fetch all listings
 */
export const getAllListings = async () => {
  try {
    const res = await fetch(`${BACKEND_URL}/api/listings`);
    const data = await res.json();
    if (!res.ok) throw new Error('Failed to fetch listings');
    return data;
  } catch (err) {
    console.error('getAllListings error', err);
    return [];
  }
};
