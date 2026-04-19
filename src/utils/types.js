export const SLOTS = {
    MORNING: 'morning',
    NOON: 'noon',
    EVENING: 'evening'
}

export const APPOINTMENTSTATUS = {
    COMPLETED: 'COMPLETED',
    PENDING: 'PENDING',
    CANCELLED: 'CANCELLED'
}

export const APPOINTMENTTYPE = {
    VIDEO: 'VIDEO',
    CLINIC: 'CLINIC',
    CHAT: 'CHAT',
    PHONE: 'PHONE'
}

export const appointmentTypes = [
    { title: 'clinic', value: APPOINTMENTTYPE.CLINIC, icon: 'hospital' },
    { title: 'video', value: APPOINTMENTTYPE.VIDEO, icon: 'video' },
    { title: 'chat', value: APPOINTMENTTYPE.CHAT, icon: 'message-circle-code' },
    { title: 'call', value: APPOINTMENTTYPE.cALL, icon: 'message-circle-code' }
]


export const ROLES = {
    PATIENT: 'PATIENT',
    DOCTOR: 'DOCTOR',
    CARETEAM: 'CARETEAM',
    ADMIN: 'ADMIN',
    RECEPTION: 'RECEPTION'
}

export const slotData = [
    {
        "end": "12:00 PM",
        "slot": "morning",
        "start": "09:00 AM"
    },
    {
        "end": "02:00 PM",
        "slot": "noon",
        "start": "12:00 PM"
    },
    {
        "end": "09:30 PM",
        "slot": "evening",
        "start": "05:30 PM"
    }
]

export const NOTIFICATIONACTION = {
    SCREEN_NAVIGATION: 'SCREEN_NAVIGATION',
}

export const SCREEN = {
    APPOINTMENT: 'appointmentScreen'
}