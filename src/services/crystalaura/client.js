import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

import { storageKey } from '~/utils/constants';

const BASE_URL = 'https://dev.devlomatix.com/api/v5/crystalaura';

const crystalAuraClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

crystalAuraClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(storageKey.ACCESSTOKEN);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default crystalAuraClient;
