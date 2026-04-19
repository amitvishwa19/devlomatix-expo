import { useColorScheme } from 'nativewind';
import { StyleSheet, Dimensions } from 'react-native'



const { height, width } = Dimensions.get('window');


const appcolors = {
    primaryColor: '#090B34',
    darkBackgroundColor: '#090B34',
    background: '#0D1017',
    foreground: '#3A3F42',
    borderColor: '#3A3F42',
    statusBar: '#0D1017'
}


export const globalStyles = StyleSheet.create({
    screenRoot: { flex: 1, backgroundColor: '#0D1017', opacity: 0.95, zIndex: -10 },
    screenRootView: { flex: 1, backgroundColor: appcolors.background, color: '#fff' },
    screenRootViewForeground: { flex: 1, backgroundColor: '#4ADE80', position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, opacity: 0.2, zIndex: -10 },


    root: { flex: 1, backgroundColor: appcolors.background, color: '#fff' }, //depritiated
    container: { backgroundColor: '#0D1017', flex: 1, color: '#d3e3fd' },
    text: { fontSize: 18, color: '#d3e3fd' },
    titleText: { color: '#fff', fontSize: 22, fontWeight: '800' },
    inputLabel: { color: '#d3e3fd', fontSize: 16, opacity: 0.6 },
    inputView: { height: 44, borderColor: appcolors.borderColor, borderWidth: 1, borderRadius: 4, alignItems: "center", justifyContent: "center", paddingLeft: 10, marginTop: 6, backgroundColor: appcolors.foreground },
    input: { width: "100%", color: '#fff', textAlign: 'left' },
    customButton: { justifyContent: 'center', alignItems: 'center', borderWidth: 1, padding: 12, borderRadius: 6, borderColor: appcolors.borderColor, backgroundColor: appcolors.foreground },
    customButtonText: { color: "#FFF", fontSize: 16, fontWeight: 'bold', letterSpacing: 0 },
    bottomNavBackground: "#FFF",
    bottomNavBorder: '#fff',
    background: '#0D1017',
    foreground: '#161B21',
    borderColor: '#3A3F42',
    textHeading: { fontSize: 24, fontWeight: 600 },
    darkBackgroundColor: { flex: 1, backgroundColor: '#0D1017', color: '#fff' },
    lightBackgroundColor: { flex: 1, backgroundColor: '#FFF', color: '#fff' }

    // page_container: { flex: 1, backgroundColor: appcolors.primaryColor, padding: 10 },
    // main_screen_container: {},
    // page_content: { height: '100%', width: '100%' },




    // background_image_container: { flex: 1, padding: 10 },
    // background_image_container_image: { opacity: 0.1 },









    // container: { justifyContent: 'center', flex: 1 },
    // container_center: { justifyContent: 'center', flex: 1, alignItems: 'center' },
    // BoldTitle: { fontSize: 40, fontWeight: 800 },

    // error_info_view: { padding: 5, marginBottom: 10 },
    // error_message: { fontWeight: '400', fontSize: 12, color: '#fff', opacity: 0.8 },

    // page_Bacground_container:{flex: 1, justifyContent: 'center', backgroundColor:'black', alignItems: 'center'},
    // page_background_container_image:{ opacity: 0.4, backgroundColor: colors.black}
})

