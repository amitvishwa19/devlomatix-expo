import React from 'react';
import { Text, View } from 'react-native';

import { ExternalLink } from './ExternalLink';
import { MonoText } from './StyledText';

export default function EditScreenInfo({ path }) {
  return (
    <View>
      <View className="mx-12 items-center">
        <Text className="text-center text-[17px] leading-6 text-slate-700">
          Open up the code for this screen:
        </Text>

        <View className="my-2 rounded bg-slate-100 px-1">
          <MonoText className="text-slate-900">{path}</MonoText>
        </View>

        <Text className="text-center text-[17px] leading-6 text-slate-700">
          Change any of the text, save the file, and your app will automatically update.
        </Text>
      </View>

      <View className="mt-4 items-center px-5">
        <ExternalLink
          className="py-4"
          href="https://docs.expo.io/get-started/create-a-new-app/#opening-the-app-on-your-phonetablet">
          <Text className="text-center text-sky-600">
            Tap here if your app doesn't automatically update after making changes
          </Text>
        </ExternalLink>
      </View>
    </View>);

}