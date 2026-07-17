import axios from "axios";
import * as SecureStore from 'expo-secure-store';
import { baseApi } from "./api";
import { storageKey } from '~/utils/constants';

const BASEURL = baseApi;

const instance = axios.create({
    baseURL: BASEURL,
    headers: {
        "Content-Type": "application/json",
    }
});

instance.interceptors.request.use(
    async (config) => {
        try {
            const token = await SecureStore.getItemAsync(storageKey.ACCESSTOKEN);
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error('Error fetching token in axios interceptor:', error);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default instance;




