import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Image, Linking, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '~/theme/AppTheme';

import BackButton from '../_components/BackButton';
import EmptyState from '../_components/EmptyState';
import FeatureHeader from '../_components/FeatureHeader';
import PermissionPopup from '../_components/PermissionPopup';
import ReadingCard from '../_components/ReadingCard';
import SectionCard from '../_components/SectionCard';
import { meterReadings } from '../_lib/mock-data';
import InteractiveBoundary from '../_components/InteractiveBoundary';
import { apiUrls } from '../../../../utils/api';


const meterInputModes =




[

{
  id: 'camera',
  title: 'Take photo',
  description: 'Capture a fresh photo of the meter from the camera.',
  icon: 'camera'
},
{
  id: 'upload',
  title: 'Upload photo',
  description: 'Select an existing meter image from the gallery.',
  icon: 'image'
}];


export default function MeterCaptureScreen() {
  const router = useRouter();
  const { palette } = useAppTheme();
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewFailed, setPreviewFailed] = useState(false);
  const [manualReading, setManualReading] = useState(`${meterReadings[0].reading}`);
  const [permissionPopup, setPermissionPopup] = useState(





    null);

  function closePermissionPopup() {
    setPermissionPopup(null);
  }

  function showPermissionPopup(params)





  {
    setPermissionPopup({
      ...params,
      onPrimaryPress: () => {
        closePermissionPopup();
        params.onPrimaryPress();
      }
    });
  }

  function setPreviewAsset(asset) {
    setPreviewFailed(false);
    setSelectedImage(asset);
    setIsExtracting(true);

    if (asset.base64) {
      const workspaceId = "cmo0zg0vp0006ycikfwb9cmw0";
      fetch(apiUrls.extractOcr(workspaceId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: asset.base64 })
      })
      .then(res => res.json())
      .then(data => {
        if (data.reading) setManualReading(data.reading);
        setIsExtracting(false);
      })
      .catch(err => {
        console.log("OCR Error:", err);
        setIsExtracting(false);
      });
    } else {
      setTimeout(() => {
        const rawReading = Math.floor(10000 + Math.random() * 90000).toString();
        setManualReading(rawReading);
        setIsExtracting(false);
      }, 2500);
    }
  }

  async function openCameraFlow() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      showPermissionPopup({
        title: 'Camera access needed',
        description: permission.canAskAgain ?
        'Allow camera access to capture a meter photo directly from this screen.' :
        'Camera access is blocked for this app. Open device settings and enable camera permission to continue.',
        icon: 'camera',
        primaryLabel: permission.canAskAgain ? 'Try again' : 'Open settings',
        onPrimaryPress: permission.canAskAgain ?
        () => openCameraFlow() :
        () => Linking.openSettings()
      });
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      cameraType: ImagePicker.CameraType.back,
      quality: 0.7,
      base64: true
    });

    if (!result.canceled && result.assets[0]) {
      setPreviewAsset(result.assets[0]);
    }
  }

  async function openUploadFlow() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      showPermissionPopup({
        title: 'Photo access needed',
        description: permission.canAskAgain ?
        'Allow photo library access to choose a meter image from this device.' :
        'Photo library access is blocked for this app. Open device settings and enable photo permission to continue.',
        icon: 'image',
        primaryLabel: permission.canAskAgain ? 'Try again' : 'Open settings',
        onPrimaryPress: permission.canAskAgain ?
        () => openUploadFlow() :
        () => Linking.openSettings()
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      base64: true
    });

    if (!result.canceled && result.assets[0]) {
      setPreviewAsset(result.assets[0]);
    }
  }

  async function handleCaptureMode(mode) {
    try {
      if (mode === 'camera') {
        const permission = await ImagePicker.getCameraPermissionsAsync();

        if (!permission.granted && permission.canAskAgain) {
          showPermissionPopup({
            title: 'Camera access needed',
            description:
            'Use the device camera to capture the latest meter reading without leaving this flow.',
            icon: 'camera',
            primaryLabel: 'Continue',
            onPrimaryPress: () => openCameraFlow()
          });
          return;
        }

        if (!permission.granted) {
          showPermissionPopup({
            title: 'Camera access needed',
            description:
            'Camera access is blocked for this app. Open device settings and enable camera permission to continue.',
            icon: 'camera',
            primaryLabel: 'Open settings',
            onPrimaryPress: () => Linking.openSettings()
          });
          return;
        }

        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          cameraType: ImagePicker.CameraType.back,
          quality: 1
        });

        if (!result.canceled && result.assets[0]) {
          setPreviewAsset(result.assets[0]);
        }

        return;
      }

      const permission = await ImagePicker.getMediaLibraryPermissionsAsync();

      if (!permission.granted && permission.canAskAgain) {
        showPermissionPopup({
          title: 'Photo access needed',
          description:
          'Choose an existing meter photo from this device and continue with the review flow.',
          icon: 'image',
          primaryLabel: 'Continue',
          onPrimaryPress: () => openUploadFlow()
        });
        return;
      }

      if (!permission.granted) {
        showPermissionPopup({
          title: 'Photo access needed',
          description:
          'Photo library access is blocked for this app. Open device settings and enable photo permission to continue.',
          icon: 'image',
          primaryLabel: 'Open settings',
          onPrimaryPress: () => Linking.openSettings()
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 1
      });

      if (!result.canceled && result.assets[0]) {
        setPreviewAsset(result.assets[0]);
      }
    } catch {
      showPermissionPopup({
        title: 'Unable to continue',
        description: 'The picker could not be opened. Try again, or check device permissions if the issue persists.',
        icon: 'exclamation',
        primaryLabel: 'Try again',
        onPrimaryPress: () => handleCaptureMode(mode)
      });
    }
  }

  return (
    <>
    <SafeAreaView className={`flex-1 ${palette.page}`}>
        <StatusBar style={palette.statusBar} />
        <ScrollView className={`flex-1 ${palette.page}`} showsVerticalScrollIndicator={false}>
          <View className="px-5 pb-8 pt-5">
            <BackButton />
            <FeatureHeader
              eyebrow="METER CAPTURE"
              title="Capture the latest reading"
              description="Pick how the user provides the meter image. OCR and backend logic will plug in later." />
            

            <SectionCard title="Input modes" description="These are UI-first entry points for the meter capture flow.">
              <View className="mt-4">
                {meterInputModes.map((mode) =>
                <Pressable
                  key={mode.id}
                  className={`mb-2 rounded-2xl p-4 ${palette.surfaceInset}`}
                  onPress={() => handleCaptureMode(mode.id)}>
                  <View className="flex-row items-start">
                      <View className={`mr-3 h-11 w-11 items-center justify-center rounded-2xl ${palette.iconCard}`}>
                        <FontAwesome name={mode.icon} size={18} color={palette.iconColor} />
                      </View>
                      <View className="flex-1">
                        <Text className={`text-base font-bold ${palette.text}`}>{mode.title}</Text>
                        <Text className={`mt-1.5 text-sm leading-5 ${palette.textSoft}`}>
                          {mode.description}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                )}
              </View>
            </SectionCard>

            <SectionCard title="Preview area">
              {selectedImage ?
              <View className="mt-4">
                  <View className={`overflow-hidden rounded-2xl ${palette.surfaceMuted}`}>
                    {previewFailed ?
                  <View className="h-64 items-center justify-center px-5">
                        <Text className={`text-base font-bold ${palette.text}`}>
                          Image selected successfully
                        </Text>
                        <Text className={`mt-2 text-center text-sm leading-6 ${palette.textSoft}`}>
                          Preview could not be rendered, but the file was picked and is ready for the next step.
                        </Text>
                      </View> :

                  <View className="relative items-center justify-center">
                    <Image
                      key={selectedImage.uri}
                      source={{ uri: selectedImage.uri }}
                      resizeMode="cover"
                      style={{ width: '100%', height: 256 }}
                      onError={() => setPreviewFailed(true)} />
                    <InteractiveBoundary />
                  </View>
                  }
                  </View>
                  <View className={`mt-3 rounded-2xl p-4 ${palette.surfaceMuted}`}>
                    <Text className={`text-xs font-bold uppercase tracking-[1px] ${palette.textMuted}`}>
                      Selected file
                    </Text>
                    <Text className={`mt-1 text-sm font-bold ${palette.text}`}>
                      {selectedImage.fileName ?? 'meter-image'}
                    </Text>
                    <Text className={`mt-1 text-sm ${palette.textSoft}`}>
                      {selectedImage.width} x {selectedImage.height}
                    </Text>
                  </View>
                  <Pressable
                  className="mt-4 rounded-2xl bg-amber-500 px-4 py-4"
                  onPress={() => router.push('./appliances')}>
                    <Text className="text-center text-sm font-bold text-white">
                      Save and continue
                    </Text>
                  </Pressable>
                </View> :

              <EmptyState
                icon="image"
                title="Meter preview placeholder"
                description="This area will later show the live scanner, camera preview, or uploaded meter image before OCR extraction." />

              }
            </SectionCard>

            <SectionCard
              title="Reading review"
              description="Confirm the extracted digits here instead of opening a separate review screen.">
              <View className={`mt-4 rounded-2xl p-4 ${palette.amberSoft}`}>
                <Text className={`text-3xl font-bold tracking-[3px] ${palette.text}`}>
                  {manualReading}
                </Text>
                <Text className={`mt-2 text-sm uppercase tracking-[1px] ${palette.textMuted}`}>
                  {selectedImage ? 'Selected meter image' : 'Latest saved reading'}
                </Text>
                <Text className={`mt-1 text-sm leading-5 ${palette.textSoft}`}>
                  96% confidence - Review before saving into the simplified flow
                </Text>
              </View>

              <Text className={`mt-4 text-sm font-bold uppercase tracking-[1px] ${palette.textMuted}`}>
                Manual correction
              </Text>
              <TextInput
                value={manualReading}
                onChangeText={setManualReading}
                keyboardType="number-pad"
                className={`mt-2 rounded-2xl border px-4 py-4 text-lg font-bold ${palette.border} ${palette.surfaceInset} ${palette.text}`} />
              

              <Pressable
                className="mt-4 rounded-2xl bg-amber-500 px-4 py-4"
                onPress={() => router.push('./appliances')}>
                <Text className="text-center text-sm font-bold text-white">
                  Save reading and open appliances
                </Text>
              </Pressable>
            </SectionCard>

            <SectionCard
              title="Recent confirmed readings"
              description="Reading history now lives on this screen so the flow stays compact.">
              {meterReadings.map((reading) =>
              <ReadingCard key={reading.id} reading={reading} />
              )}
            </SectionCard>
          </View>
        </ScrollView>
      </SafeAreaView>

      {permissionPopup ?
      <PermissionPopup
        visible
        title={permissionPopup.title}
        description={permissionPopup.description}
        icon={permissionPopup.icon}
        primaryLabel={permissionPopup.primaryLabel}
        onPrimaryPress={permissionPopup.onPrimaryPress}
        onClose={closePermissionPopup} /> :

      null}
    </>);

}