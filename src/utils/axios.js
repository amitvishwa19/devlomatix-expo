import axios from "axios";
import { baseApi } from "./api";


const BASEURL = baseApi
//const basicToken = 'cGXysWJlcJhdsSJdIUP873mVzaFYxLTEyM1NlY3JldA';
//const accessToken = await AsyncStorage.getItem(storageKey.ACCESSTOKEN)


//console.log('accessToken from axios', accessToken)

export default axios.create({
    baseURL: BASEURL,
    headers: {
        "Content-Type": "application/json",
    }
})



