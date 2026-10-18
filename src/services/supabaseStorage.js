const SUPABASE_URL = 'https://cpjjmcqftkgnmrghgsfq.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwamptY3FmdGtnbm1yZ2hnc2ZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NjcyNjcsImV4cCI6MjA4ODU0MzI2N30.D6I1ZuptcQWmOeeqPsE6_oDlRa_QrUqZgrNQbpaStY8';
const DEFAULT_BUCKET = 'devlomatix';

/**
 * Upload an image or file asset to Supabase Storage `devlomatix` bucket
 *
 * @param {Object} options
 * @param {string} options.uri - Local file URI (file://, content://, or http/blob)
 * @param {string} [options.name] - Optional original file name
 * @param {string} [options.mimeType] - Mime type (e.g. 'image/jpeg', 'image/png')
 * @param {string} [options.folder] - Folder path inside the bucket (default: 'dcr')
 * @param {string} [options.bucket] - Bucket name (default: 'devlomatix')
 * @returns {Promise<{ success: boolean, publicUrl: string, filePath: string }>}
 */
export async function uploadImageToSupabase({
  uri,
  name,
  mimeType = 'image/jpeg',
  folder = 'dcr',
  bucket = DEFAULT_BUCKET,
}) {
  if (!uri) {
    throw new Error('Image URI is required for upload');
  }

  const fileExt = name ? name.split('.').pop() : 'jpg';
  const cleanExt = (fileExt || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${cleanExt}`;
  const filePath = `${folder}/${fileName}`;
  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${bucket}/${filePath}`;

  let body;
  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  };

  try {
    const fileRes = await fetch(uri);
    body = await fileRes.blob();
    headers['Content-Type'] = mimeType || 'image/jpeg';
  } catch (_e) {
    // Fallback for native multipart FormData
    const formData = new FormData();
    formData.append('', {
      // @ts-ignore
      uri,
      name: fileName,
      type: mimeType || 'image/jpeg',
    });
    body = formData;
  }

  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers,
    body,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Supabase upload failed (${res.status}): ${errorText}`);
  }

  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${filePath}`;

  return {
    success: true,
    filePath,
    publicUrl,
  };
}

/**
 * Upload multiple images to Supabase Storage concurrently or sequentially
 *
 * @param {Array<{ uri: string, name?: string, mimeType?: string }>} assets
 * @param {string} [folder='dcr']
 * @returns {Promise<string[]>} Array of public URLs
 */
export async function uploadMultipleImages(assets = [], folder = 'dcr') {
  if (!assets || assets.length === 0) return [];

  const uploadPromises = assets.map((asset) =>
    uploadImageToSupabase({
      uri: asset.uri,
      name: asset.name,
      mimeType: asset.mimeType,
      folder,
    })
  );

  const results = await Promise.all(uploadPromises);
  return results.map((r) => r.publicUrl);
}
