import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const isWeb = Platform.OS === 'web';

/** USER STORAGE **/
export const saveUser = async (user) => {
  try {
    if (isWeb) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      await AsyncStorage.setItem('user', JSON.stringify(user));
    }
  } catch (e) {
    console.warn('saveUser', e);
  }
};

export const getUser = async () => {
  try {
    if (isWeb) {
      const s = localStorage.getItem('user');
      return s ? JSON.parse(s) : null;
    } else {
      const s = await AsyncStorage.getItem('user');
      return s ? JSON.parse(s) : null;
    }
  } catch (e) {
    console.warn('getUser', e);
    return null;
  }
};

export const logoutUser = async () => {
  try {
    if (isWeb) localStorage.removeItem('user');
    else await AsyncStorage.removeItem('user');
  } catch (e) {
    console.warn('logoutUser', e);
  }
};

/** ONBOARDING **/
export const saveOnboardingSeen = async () => {
  try {
    if (isWeb) localStorage.setItem('onboardingSeen', '1');
    else await AsyncStorage.setItem('onboardingSeen', '1');
  } catch (e) { /* ignore */ }
};

export const getOnboardingSeen = async () => {
  try {
    if (isWeb) return Boolean(localStorage.getItem('onboardingSeen'));
    else return Boolean(await AsyncStorage.getItem('onboardingSeen'));
  } catch (e) {
    return false;
  }
};

/** IMAGE UPLOAD **/
export const uploadImageToSupabase = async (uri, userId = 'public') => {
  try {
    // Convert local URI to blob
    const response = await fetch(uri);
    const blob = await response.blob();

    const timestamp = Date.now();
    const filename = `${userId}/listing_${timestamp}.jpg`;

    // Upload to Supabase
    const { data, error } = await supabase.storage
      .from('listings')
      .upload(filename, blob, { upsert: true });

    if (error) throw error;

    // Get public URL
    const { publicUrl, error: urlError } = supabase.storage
      .from('listings')
      .getPublicUrl(filename);

    if (urlError) throw urlError;

    return publicUrl;
  } catch (error) {
    console.error('Image upload failed:', error);
    throw error;
  }
};
