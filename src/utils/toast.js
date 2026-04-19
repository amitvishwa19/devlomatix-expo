import { Text, View } from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons'

export const toastConfig = {

    error: ({ text1, text2, props }) => (
        <View className=' p-2 rounded-lg w-full mx-1 '>
            <View className='bg-green-600 p-4 rounded-lg flex-row items-center'
                style={{ backgroundColor: '#fff', borderRadius: 6, borderLeftColor: 'red', borderLeftWidth: 5 }}
            >

                <View className="p-1 rounded-full bg-red-200 flex mr-4">
                    <Ionicons name={'close-circle-outline'} size={24} className='font-bold' />
                </View>
                <View>
                    <Text className='font-bold text-lg'>{text1}</Text>
                    <Text className='font-bold text-sm text-gray-400'>{text2}</Text>
                </View>


            </View>
        </View>
    ),

    success: ({ text1, text2, props }) => (
        <View className=' p-2 rounded-lg w-full mx-1'>
            <View className='bg-green-600 p-4 rounded-lg flex-row items-center'
                style={{ backgroundColor: '#fff', borderRadius: 6, borderLeftColor: 'green', borderLeftWidth: 5 }}
            >

                <View className="p-1 rounded-full bg-green-200 flex mr-4">
                    <Ionicons name={'checkmark-circle-outline'} size={24} className='font-bold' />
                </View>
                <View>
                    <Text className='font-bold text-lg'>{text1}</Text>
                    <Text className='font-bold text-sm text-gray-400'>{text2}</Text>
                </View>

            </View>
        </View >
    )
};