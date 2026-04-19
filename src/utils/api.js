




//export const baseApi = 'http://192.168.29.31:3000/api/v4'
//const baseApi = 'https://healthyfine.devlomatix.in/api/v4'


//ACS
export const baseApi = 'https://dev.devlomatix.com/api/v5'

export const apiUrls = {

    //Auth
    register: baseApi + '/auth/register',  //POST
    login: baseApi + '/auth/login',  //POST
    googleLogin: baseApi + '/auth/login/google',  //POST
    userfromtoken: baseApi + '/auth/userfromtoken',  //POST
    userFromId: baseApi + '/auth/user',  //POST



    //Transactions
    transaction: baseApi + '/payment/transaction',  // GET
    transaction: baseApi + '/payment/transaction',  // Post
    transactionsDelete: baseApi + '/payment/transaction',  // delete


    //Payment
    //Razorpay
    razorpayOrder: baseApi + '/payment/razorpay',  // POST
    verifyPayment: baseApi + '/payment/verify' //POST

    //Profile
    ,
    getProfileData: baseApi + '/profile/hospitalsetting',  // GET
    updateProfileData: baseApi + '/profile/hospitalsetting',  // POST


    //FCM Notification
    fcmNotification: baseApi + '/fcm',  // POST
    fcmExpoNotification: baseApi + '/fcm/expo',  // POST

    //Energy OCR
    extractOcr: function(workspaceId) { return "http://10.0.2.2:3000/api/workspace/" + workspaceId + "/energy/ai/ocr"; }
}

