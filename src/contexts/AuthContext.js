import { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from 'expo-secure-store';
import { PermissionsAndroid, Platform } from "react-native";
import axios from "~/utils/axios";
import { apiUrls } from "~/utils/api";
import { storageKey } from "../utils/constants";
import { useRouter } from "expo-router";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import * as Notifications from 'expo-notifications';
import { useApp } from "./AppContext";
import messaging from '@react-native-firebase/messaging';
import { useNotification } from "./NotificationContext";

export const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {

    const [user, setUser] = useState(null)
    const [accessToken, setAccessToken] = useState(null)
    const [server, setServer] = useState(null)
    const [authState, setAuthState] = useState({ accessToken: null, authenticated: false, user: null, })
    const [deviceToken, setDeviceToken] = useState(null)
    const router = useRouter()
    const { expoPushToken } = useNotification()



    useEffect(() => {
        getDeviceTocken()
        getUserFromToken()
    }, [])


    const getDeviceTocken = async () => {

        // const token = (await Notifications.getDevicePushTokenAsync()).data;
        // console.log('@Devicetoken', token)
        // setDeviceToken(token)


        if (Platform.OS === 'android') {
            PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
            const authStatus = await messaging().requestPermission();
            const enabled =
                authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                authStatus === messaging.AuthorizationStatus.PROVISIONAL;

            if (enabled) {
                await messaging().registerDeviceForRemoteMessages();
                const token = await messaging().getToken()
                setDeviceToken(token)
            }

        } else {
            async function requestUserPermission() {
                const authStatus = await messaging().requestPermission();
                const enabled =
                    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

                if (enabled) {
                    const token = await messaging().getToken()
                    setDeviceToken(token)
                }
            }
        }
    }

    const register = async (email, password, location) => {
        try {

            const res = await axios.post(apiUrls.register, { email, password, deviceToken, location })
            console.log(res.data)


            return res?.data
        } catch (error) {
            return { error: true, msg: error }
        }
    }

    const googleLogin = async (data) => {
        //console.log('first time google login called from auth context', data)

        try {
            const res = await axios.post(apiUrls.googleLogin, { ...data, deviceToken, expoPushToken })

            //console.log('@google login ', res.data.status)


            if (res?.data?.status === 200) {

                setAuthState({
                    accessToken: res?.data?.user?.accessToken,
                    authenticated: true,
                    user: res?.data?.user,
                })



                setUser(res.data?.user)
                await SecureStore.setItemAsync(storageKey.ACCESSTOKEN, res?.data?.user?.accessToken)
                const resp = axios.defaults.headers.common['Authorization'] = `${res?.data?.user?.accessToken}`

                return res.data
            }
            return null

        } catch (error) {
            console.log('@error', error)
        }
    }

    const emailLogin = async (email, password, location) => {
        try {
            const res = await axios.post(apiUrls.login, { email, password, location })
            if (res.data.status === 200) {
                setAuthState({
                    accessToken: res?.data?.user?.accessToken,
                    authenticated: true,
                    user: res?.data?.user,
                })
                setUser(res?.data?.user)
                axios.defaults.headers.common['Authorization'] = `${res?.data?.user?.accessToken}`
                await SecureStore.setItemAsync(storageKey.ACCESSTOKEN, res?.data?.user?.accessToken)

                return res.data
            }
            return null;

        } catch (error) {
            console.log('Login error from context', error)
        }
    }

    const getUserFromToken = async () => {

        try {
            const accessToken = await SecureStore.getItemAsync(storageKey.ACCESSTOKEN);



            if (accessToken) {
                axios.defaults.headers.common['Authorization'] = `${accessToken}`
                const res = await axios.post(apiUrls.userfromtoken)


                if (res?.data.status == 200) {


                    setAuthState({
                        accessToken: res?.data?.user?.accessToken,
                        authenticated: true,
                        user: res.data.user,
                    })
                    setUser(res.data.user)
                    return res.data.user
                }
                return null
            }
        } catch (error) {
            router.replace('/(auth)/loginScreen')
            return null
        }

    }

    const logout = async () => {
        await GoogleSignin.signOut();
        await SecureStore.deleteItemAsync(storageKey.ACCESSTOKEN)
        await SecureStore.setItemAsync(storageKey.AUTH_STATUS, 'false')
        setAuthState({ accessToken: null, authenticated: false, user: null })
        // setUser(null)
        axios.defaults.headers.common['Authorization'] = ''
    }

    return (
        <AuthContext.Provider value={{
            getUserFromToken,
            logout,
            user,
            register,
            emailLogin,
            googleLogin,
        }}>
            {children}
        </AuthContext.Provider>
    )
}
export const useAuth = () => useContext(AuthContext)
//export default AuthProvider