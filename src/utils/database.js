import { Platform } from 'react-native';

// Backend base URL
const BACKEND_URL = 'https://listai-backend.onrender.com';

/**
 * Upload image to backend (Cloudinary)
 * @param {string} uri - local image URI
 * @returns {Promise<string|null>} - uploaded image URL from backend or null
 */
export const uploadImage = async (uri) => {
  if (!uri) return null;

  try {
    const formData = new FormData();
    const filename = uri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image';

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

    let data;
    const text = await response.text();
    try {
      data = JSON.parse(text);
    } catch (err) {
      throw new Error(`Invalid JSON from server: ${text.substring(0, 200)}`);
    }

    if (!response.ok) throw new Error(data?.message || 'Image upload failed');

    return data.path || null;
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
    // 🚫 IMAGE UPLOAD SKIPPED – no image will be saved
    // This avoids the 500 error on /api/upload while you test other functionality.
    // If you want to re-enable uploads later, uncomment the lines below.
    let uploadedImagePath = null;

    // // Upload image if provided
    // if (listing.imageUri) {
    //   uploadedImagePath = await uploadImage(listing.imageUri);
    // }

    const keywords = Array.isArray(listing.keywords)
      ? listing.keywords
      : listing.keywords
      ? JSON.parse(listing.keywords)
      : [];

    const payload = {
      title: listing.title || '',
      price: listing.price || '',
      description: listing.description || '',
      keywords,
      platform: listing.platform || '',
      additionalInfo: listing.additionalInfo || '',
      imageUri: uploadedImagePath, // will be null
    };

    const res = await fetch(`${BACKEND_URL}/api/listings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      throw new Error(`Invalid JSON from server: ${text.substring(0, 200)}`);
    }

    if (!res.ok) throw new Error(data?.message || 'Failed to save listing');

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
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      console.error('getAllListings parse error', err, text);
      return [];
    }

    if (!res.ok) throw new Error('Failed to fetch listings');

    return data;
  } catch (err) {
    console.error('getAllListings error', err);
    return [];
  }
};