// Upload direct (preset non signe) vers Cloudinary.
// Utilise pour les photos/videos des publications et des stories.

const CLOUD_NAME = 'weijnjqw';
const UPLOAD_PRESET = 'jangubi_media';

export async function uploadToCloudinary(file, resourceType) {
  const type = resourceType || 'auto';
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  const response = await fetch(
    'https://api.cloudinary.com/v1_1/' + CLOUD_NAME + '/' + type + '/upload',
    { method: 'POST', body: formData }
  );
  if (!response.ok) {
    throw new Error("Echec de l'envoi du fichier vers Cloudinary");
  }
  const data = await response.json();
  return data.secure_url;
}
