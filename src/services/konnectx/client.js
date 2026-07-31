import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

import { storageKey } from '~/utils/constants';

const BASE_URL = 'https://dev.devlomatix.com/api/v5/konnectx';

let currentCredential = null;

export function setClientCredential(cred) {
  currentCredential = cred;
}

export function getClientCredential() {
  return currentCredential;
}

const konnectxClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

konnectxClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(storageKey.ACCESSTOKEN);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (currentCredential) {
    const credId = currentCredential.id || currentCredential._id;
    config.params = config.params || {};
    if (credId) {
      config.params.credentialId = credId;
      config.params.credential_id = credId;
      config.headers['x-credential-id'] = String(credId);
      config.headers['credentialid'] = String(credId);
    }
    if (currentCredential.wabaId) {
      config.params.wabaId = currentCredential.wabaId;
      config.params.waba_id = currentCredential.wabaId;
      config.headers['x-waba-id'] = String(currentCredential.wabaId);
      config.headers['wabaid'] = String(currentCredential.wabaId);
    }
    if (currentCredential.phoneNumberId) {
      config.params.phoneNumberId = currentCredential.phoneNumberId;
      config.params.phone_number_id = currentCredential.phoneNumberId;
      config.headers['x-phone-number-id'] = String(currentCredential.phoneNumberId);
      config.headers['phonenumberid'] = String(currentCredential.phoneNumberId);
    }
  }
  return config;
});

export default konnectxClient;
