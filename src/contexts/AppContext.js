import { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from 'expo-secure-store';
import { globalKeys, storageKey } from "~/utils/constants";
import { Dimensions, PermissionsAndroid, Platform, useColorScheme, useWindowDimensions } from "react-native";
import Geolocation from 'react-native-geolocation-service';
import axios from "axios";
import { ROLES } from "~/utils/types";
import * as Device from 'expo-device';
import * as Location from 'expo-location';
import messaging from '@react-native-firebase/messaging';


export const AppContext = createContext(null)
export const AppProvider = ({ children }) => {
    const [location, setLocation] = useState(null)
    const [user, setUser] = useState(null)
    const [theme, setTheme] = useState('dark')
    const [coords, setCoords] = useState(null)
    const isDarkMode = useColorScheme()
    const [orientation, setOrientation] = useState(null);
    const [role, setRole] = useState(ROLES.PATIENT)
    const [navigate, setNavigate] = useState(null)
    const { height, width } = useWindowDimensions();
    const [dimention, setDimention] = useState({ height, width })
    const [bottomTab, setBottomTab] = useState(true)
    const [device, setDevice] = useState({ mode: '', type: '', name: '', height: '', width })
    const [errorMsg, setErrorMsg] = useState(null)
    //const [location, setLocation] = useState(null);



    useEffect(() => {
        handleAppPermissions()
    }, [])


    useEffect(() => {
        setDevice({
            ...device,
            mode: dimention.width < dimention.height ? 'PORTRAIT' : 'LANDSCAPE',
            type: Device.deviceType,
            name: Device.deviceName,
            height: Dimensions.get('window').height,
            width: Dimensions.get('window').width
        })

    }, [height, width])


    useEffect(() => {
        userInfoFromStorage()
        //handleLocationService()
    }, [])


    //Getting app theme
    useEffect(() => {
        const getTheme = async () => {
            const dark = await SecureStore.getItem(storageKey.DARKTHEME)
            if (dark === 'true') {
                setTheme('dark')
            } else {
                setTheme('light')
            }
        }

        getTheme()
    }, [theme])



    useEffect(() => {
        (async () => {


            //console.log('env', process.env.GOOGLE_MAP_KEY)

            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            );

            if (granted) {
                let position = await Location.getCurrentPositionAsync({});
                const { data } = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${position.coords.latitude},${position.coords.longitude}&key=AIzaSyDTrT9wArzXPonec7Z-X2xo4ERBqltU_Ow`)
                const address = data?.results[0]?.formatted_address
                setLocation({ position, address })
            }


        })();
    }, []);

    const handleAppPermissions = async () => {

        if (Platform.OS === 'android') {
            const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);

        }


    }


    const handleLocationService = async () => {

        // if (Platform.OS === 'android') {

        //     try {
        //         const granted = await PermissionsAndroid.request(
        //             PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        //         );

        //         Geolocation.getCurrentPosition(
        //             async (position) => {


        //                 const { data } = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${position.coords.latitude},${position.coords.longitude}&key=${globalKeys.mapApiKey}`)
        //                 const address = data?.results[0]?.formatted_address

        //                 setLocation({
        //                     ...location,
        //                     googleAddress: address,
        //                     coords: position.coords,
        //                     address:
        //                     {
        //                         add1: '',
        //                         add2: '',
        //                         landmark: '',
        //                         city: '',
        //                         state: '',
        //                         country: '',
        //                         pincode: '',
        //                     }
        //                 }
        //                 )
        //                 data.results[0].formatted_address
        //                 console.log('Address Id', address.split(","));
        //             },
        //             (error) => {
        //                 // See error code charts below.
        //                 console.log(error.code, error.message);
        //             },
        //             { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        //         );
        //         // }
        //     } catch (err) {
        //         console.log(err);
        //     }
        // }

        try {
            console.log('getting location from Expo Location')
            let { status } = await Location.requestForegroundPermissionsAsync();
            console.log('getting location from Expo Location location', status)



            if (status !== 'granted') {
                //setErrorMsg('Permission to access location was denied');
                console.log('Permission to access location was denied')
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            console.log('getting location from Expo Location location', location)
        } catch (error) {
            console.log('Error getting location from Expo Location location', error)

        }
    };

    const userInfoFromStorage = async () => {
        const jsonData = await AsyncStorage.getItem(storageKey.APP_USER)
        const data = JSON.parse(jsonData)
        setUser(data)
    }

    const setUserInfo = async (data) => {
        console.log('setuserinfo', data)
        setUser(data)
        await AsyncStorage.setItem(storageKey.APP_USER, JSON.stringify(data))
    }

    const getLocalValues = async () => {
        await AsyncStorage.setItem('ONBOARDING_STATUS', 'ok');
        //ONBOARDING = await AsyncStorage.getItem('ONBOARDING')
    }

    const updateOnboardingStatus = async () => {
        await AsyncStorage.setItem('ONBOARDING_STATUS', 'done')
        //console.log('onboarding status updated')
    }

    const ONBOARDING = async () => {
        const data = await AsyncStorage.getItem('ONBOARDING_STATUS')
        return data
    }

    return (
        <AppContext.Provider value={{
            ONBOARDING,
            updateOnboardingStatus,
            location, setLocation,
            setUserInfo,
            theme, setTheme, isDarkMode, orientation, role, setRole, navigate, setNavigate, dimention,
            bottomTab, setBottomTab,
            device
        }}>
            {children}
        </AppContext.Provider>
    )
}

export const useApp = () => useContext(AppContext)