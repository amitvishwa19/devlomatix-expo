import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import IosAlertModal from '~/components/IosAlertModal';

export const IosAlertContext = createContext(null);

// Global listener hook for Alert.alert
let globalAlertListener = null;

// Preserve native alert reference
const nativeAlert = Alert.alert.bind(Alert);

/**
 * Intelligent icon and tint inference based on title, message, and button styles.
 */
function inferAlertIcon(title = '', message = '', buttons = []) {
  const combined = `${title} ${message}`.toLowerCase();
  const hasDestructive = Array.isArray(buttons) && buttons.some((b) => b?.style === 'destructive');

  if (hasDestructive || combined.includes('delete') || combined.includes('remove') || combined.includes('trash')) {
    return { icon: 'trash-outline', iconColor: '#ef4444' };
  }
  if (
    combined.includes('restricted') ||
    combined.includes('permission') ||
    combined.includes('unauthorized') ||
    combined.includes('access restricted') ||
    combined.includes('admin only') ||
    combined.includes('access management')
  ) {
    return { icon: 'shield-outline', iconColor: '#f59e0b' };
  }
  if (
    combined.includes('error') ||
    combined.includes('failed') ||
    combined.includes('cannot') ||
    combined.includes('could not') ||
    combined.includes('invalid')
  ) {
    return { icon: 'alert-circle-outline', iconColor: '#ef4444' };
  }
  if (combined.includes('warning') || combined.includes('caution') || combined.includes('critical')) {
    return { icon: 'warning-outline', iconColor: '#f59e0b' };
  }
  if (
    combined.includes('success') ||
    combined.includes('saved') ||
    combined.includes('sent') ||
    combined.includes('dispatched') ||
    combined.includes('updated') ||
    combined.includes('completed')
  ) {
    return { icon: 'checkmark-circle-outline', iconColor: '#10b981' };
  }
  if (combined.includes('whatsapp') || combined.includes('chat') || combined.includes('message')) {
    return { icon: 'chatbubbles-outline', iconColor: '#0284c7' };
  }
  if (combined.includes('call') || combined.includes('paging') || combined.includes('phone')) {
    return { icon: 'call-outline', iconColor: '#6366f1' };
  }
  if (combined.includes('pdf') || combined.includes('print') || combined.includes('export')) {
    return { icon: 'document-text-outline', iconColor: '#0284c7' };
  }

  return { icon: null, iconColor: null };
}

// Monkey-patch Alert.alert globally across the React Native runtime
Alert.alert = function (title, message, buttons, options) {
  if (globalAlertListener) {
    globalAlertListener({ title, message, buttons, options });
  } else {
    nativeAlert(title, message, buttons, options);
  }
};

export function IosAlertProvider({ children }) {
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    buttons: [],
    icon: null,
    iconColor: null,
    closeOnBackdrop: false,
  });

  const closeAlert = useCallback(() => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  }, []);

  const showAlert = useCallback(({ title, message, buttons, options }) => {
    let alertTitle = typeof title === 'string' ? title : String(title || '');
    let alertMessage = message;
    let alertButtons = buttons;
    let alertOptions = options;

    // Handle signature when 2nd param is buttons array (Alert.alert('Title', buttons))
    if (Array.isArray(message) && buttons === undefined) {
      alertButtons = message;
      alertMessage = '';
    }

    if (typeof alertMessage !== 'string' && alertMessage != null) {
      alertMessage = String(alertMessage);
    }

    const inferred = inferAlertIcon(alertTitle, alertMessage, alertButtons);
    const icon = alertOptions?.icon || inferred.icon;
    const iconColor = alertOptions?.iconColor || inferred.iconColor;
    const closeOnBackdrop = alertOptions?.cancelable ?? false;

    // Wrap buttons so they dismiss the modal when clicked
    const wrappedButtons = (alertButtons && alertButtons.length > 0 ? alertButtons : [{ text: 'OK', style: 'default' }]).map(
      (btn) => ({
        ...btn,
        onPress: () => {
          setAlertConfig((prev) => ({ ...prev, visible: false }));
          if (btn?.onPress) {
            btn.onPress();
          }
        },
      })
    );

    setAlertConfig({
      visible: true,
      title: alertTitle,
      message: alertMessage || '',
      buttons: wrappedButtons,
      icon,
      iconColor,
      closeOnBackdrop,
    });
  }, []);

  useEffect(() => {
    globalAlertListener = showAlert;
    return () => {
      globalAlertListener = null;
    };
  }, [showAlert]);

  return (
    <IosAlertContext.Provider value={{ showAlert, closeAlert }}>
      {children}
      <IosAlertModal
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        icon={alertConfig.icon}
        iconColor={alertConfig.iconColor}
        closeOnBackdrop={alertConfig.closeOnBackdrop}
        onClose={closeAlert}
      />
    </IosAlertContext.Provider>
  );
}

export function useIosAlert() {
  const context = useContext(IosAlertContext);
  if (!context) {
    return {
      showAlert: ({ title, message, buttons, options }) =>
        Alert.alert(title, message, buttons, options),
      closeAlert: () => {},
    };
  }
  return context;
}

export default IosAlertProvider;
