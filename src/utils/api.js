//export const baseApi = 'http://192.168.29.31:3000/api/v4'
//const baseApi = 'https://healthyfine.devlomatix.in/api/v4'

//ACS
export const baseApi = "https://dev.devlomatix.com/api/v5";

export const apiUrls = {
  //Auth
  register: baseApi + "/auth/register", //POST
  login: baseApi + "/auth/login", //POST
  googleLogin: baseApi + "/auth/login/google", //POST
  userfromtoken: baseApi + "/auth/userfromtoken", //POST
  userFromId: baseApi + "/auth/user", //POST

  //Agent tab
  agent: baseApi + "/agent",

  //Payment
  //Razorpay
  razorpayOrder: baseApi + "/payment/razorpay", // POST
  verifyPayment: baseApi + "/payment/verify", //POST

  //Profile
  getProfileData: baseApi + "/profile/hospitalsetting", // GET
  updateProfileData: baseApi + "/profile/hospitalsetting", // POST

  //FCM Notification
  fcmNotification: baseApi + "/fcm", // POST
  fcmExpoNotification: baseApi + "/fcm/expo", // POST


  //Konnectx
  konnectx: baseApi + "/konnectx/",


  contact: baseApi + "/konnectx/contacts", // GET (list), POST (create)
  templates: baseApi + "/konnectx/templates", // GET (list), POST (create)
  contactById: baseApi + "/konnectx/contacts", // GET/PUT/DELETE /contacts/:id

  chats: baseApi + "/konnectx/chats", // GET/PUT/DELETE /contacts/:id

  //Kanban
  kanban: baseApi + "/kanban", // GET
  kanbanTasks: baseApi + "/kanban/tasks", // POST
  kanbanTaskById: baseApi + "/kanban/tasks", // PATCH/DELETE /tasks/:id
  kanbanColumns: baseApi + "/kanban/columns", // POST
  kanbanColumnById: baseApi + "/kanban/columns", // DELETE /columns/:id
  kanbanChecklists: baseApi + "/kanban/tasks", // POST /tasks/:id/checklists
  kanbanChecklistItem: baseApi + "/kanban/tasks", // PATCH/DELETE /tasks/:id/checklists/:itemId
  kanbanAiDescription: baseApi + "/kanban/ai/generate-description", // POST

  //Energy OCR
  extractOcr: function (workspaceId) {
    return (
      "http://10.0.2.2:3000/api/workspace/" + workspaceId + "/energy/ai/ocr"
    );
  },
};
