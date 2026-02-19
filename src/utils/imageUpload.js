// src/utils/imageUpload.js

export const uploadImage = async (uri) => {
  try {
    const formData = new FormData();

    formData.append('file', {
      uri,
      type: 'image/jpeg',
      name: 'upload.jpg',
    });

    formData.append('upload_preset', 'YOUR_UPLOAD_PRESET');

    const res = await fetch(
      'https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/upload',
      {
        method: 'POST',
        body: formData,
      }
    );

    const data = await res.json();

    if (!data.secure_url) throw new Error('Upload failed');

    return data.secure_url;
  } catch (err) {
    console.error('Image upload error:', err);
    throw err;
  }
};
