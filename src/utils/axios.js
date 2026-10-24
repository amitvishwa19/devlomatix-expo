import axios from "axios";
import * as SecureStore from 'expo-secure-store';
import { baseApi } from "./api";
import { storageKey } from '~/utils/constants';

import { getSession, refreshAuthSession } from '~/utils/authStorage';

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
            // Avoid attaching stale token to login/register/refresh calls
            if (config.url && (config.url.includes('/auth/login') || config.url.includes('/auth/register'))) {
                return config;
            }
            const session = await getSession();
            const token = session?.accessToken || (await SecureStore.getItemAsync(storageKey.ACCESSTOKEN));
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            config.headers['x-client-platform'] = 'mobile';
            config.headers['x-mobile-app'] = 'true';
        } catch (error) {
            console.error('Error fetching token in axios interceptor:', error);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

instance.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error && !error.response && error.request) {
            error.isOffline = true;
        }
        const originalRequest = error?.config;
        if (
            error?.response?.status === 401 &&
            originalRequest &&
            !originalRequest._retry &&
            !originalRequest.url?.includes('/auth/userfromtoken')
        ) {
            originalRequest._retry = true;
            try {
                const refreshed = await refreshAuthSession();
                if (refreshed?.accessToken) {
                    originalRequest.headers.Authorization = `Bearer ${refreshed.accessToken}`;
                    return instance(originalRequest);
                }
            } catch (refreshErr) {
                return Promise.reject(refreshErr);
            }
        }
        return Promise.reject(error);
    }
);

export default instance;




