import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';
import { useAppTheme } from '~/theme/AppTheme';

const UniversalLoaderContext = createContext(null);

export function UniversalLoaderProvider({ children }) {
  const { palette } = useAppTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('Loading...');
  const timeoutRef = useRef(null);

  const showLoader = useCallback((customMessage = 'Loading...') => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setMessage(customMessage);
    setIsLoading(true);

    // Auto safety timeout to prevent stuck loader (15s max)
    timeoutRef.current = setTimeout(() => {
      setIsLoading(false);
    }, 15000);
  }, []);

  const hideLoader = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsLoading(false);
  }, []);

  const withLoading = useCallback(async (asyncFn, customMessage = 'Processing...') => {
    showLoader(customMessage);
    try {
      return await asyncFn();
    } finally {
      hideLoader();
    }
  }, [showLoader, hideLoader]);

  const value = {
    isLoading,
    message,
    showLoader,
    hideLoader,
    withLoading
  };

  return (
    <UniversalLoaderContext.Provider value={value}>
      {children}
      {isLoading && (
        <Modal
          transparent
          animationType="fade"
          visible={isLoading}
          onRequestClose={() => hideLoader()}
        >
          <View className="flex-1 items-center justify-center bg-black/60 px-6">
            <Pressable
              className="w-full max-w-[280px] items-center justify-center rounded-[24px] border p-6 shadow-2xl"
              style={{
                backgroundColor: palette.colors.surface || '#1e293b',
                borderColor: palette.colors.border || 'rgba(255,255,255,0.1)'
              }}
              onPress={(e) => e.stopPropagation()}
            >
              <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-sky-500/10">
                <ActivityIndicator size="large" color="#0284c7" />
              </View>
              <Text
                className="text-center text-[15px] font-bold leading-5"
                style={{ color: palette.textColor || '#fff' }}
              >
                {message}
              </Text>

              <Text
                className="mt-1 text-center text-[11px] font-medium"
                style={{ color: palette.textMutedColor || '#94a3b8' }}
              >
                Please wait a moment
              </Text>
            </Pressable>
          </View>
        </Modal>
      )}
    </UniversalLoaderContext.Provider>
  );
}

export function useUniversalLoader() {
  const context = useContext(UniversalLoaderContext);
  if (!context) {
    throw new Error('useUniversalLoader must be used within UniversalLoaderProvider');
  }
  return context;
}
