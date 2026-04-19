

export const storageKey = {
    APP_USER: 'APP_USER',
    AUTH_STATUS: 'AUTH_STATUS',
    ONBOARDING: 'ONBOARDING',
    DARKTHEME: 'DARKTHEME',
    ACCESSTOKEN: 'ACCESSTOKEN',
    TERMSNPRIVACY: 'TERMSNPRIVACY',
    NOTIFICATION: 'NOTIFICATION'
}

export const appcolors = {
    primaryColor: '#090B34',
    darkBackgroundColor: '#090B34',
    background: '#0D1017',
    foreground: '#161B21',
    buttonColor: '#033E3E'
}


export const globalcolors = {
    gradientForm: '#A376F1',
    primary: '#7d5fff',
    white: '#FFFFFF',
    dark: '#444',
    bgColor: '#82ccdd',
    warning: '#f0d500',
    danger: '#FF0D0E',
    gray: '#666666',
    grayLight: '#ccc',
    black: '#0a0a0a',
    darkMode: '#191970',
    primaryColor: '#090B34',

};

export const hospitalDefaultSettings = {
    open: true,
    timing: [
        { slot: 'MORNING', start: '09:00 AM', end: '12:00 PM' },
        { slot: 'AFTERNOON', start: '01:00 PM', end: '05:00 PM' },
        { slot: 'EVENING', start: '05:30 PM', end: '09:30 PM' },
    ],
    slotTime: 15,
    consultationOptions: [
        { type: 'CLINIC', status: true, charge: 250, icon: 'business-outline' },
        { type: 'VIDEO', status: false, charge: 150, icon: 'videocam-outline' },
        { type: 'CHAT', status: false, charge: 150, icon: 'chatbubbles-outline' },
        { type: 'PHONE', status: false, charge: 150, icon: 'call-outline' },
    ]
}

export const onboardingScreen = 'onboardingScreen'

export const globalKeys = {
    mapApiKey: 'ENV_GOOGLE_MAP_KEY'
}



export const openAiApiKey = 'ENV_OPENAI_API_KEY'
export const aiMlApiKey = 'ENV_AIML_API_KEY'
export const googleGemeniApiKey = 'ENV_GOOGLE_GEMENI_API_KEY'
export const aiApiKey = aiMlApiKey





