//export const baseApi = 'http://192.168.29.31:3000/api/v4'
//const baseApi = 'https://healthyfine.devlomatix.in/api/v4'

//export const baseApi = "http://192.168.29.31:3000/api/v5";
export const baseApi = "https://dev.devlomatix.com/api/v5";
//export const baseApi = "https://devlomatix.com/api/v5";

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
  kanbanCloneColumn: baseApi + "/kanban/columns", // POST /columns/:id/clone
  kanbanChecklists: baseApi + "/kanban/tasks", // POST /tasks/:id/checklists
  kanbanChecklistItem: baseApi + "/kanban/tasks", // PATCH/DELETE /tasks/:id/checklists/:itemId
  kanbanAiDescription: baseApi + "/kanban/ai/generate-description", // POST

  //Energy OCR
  extractOcr: function (workspaceId) {
    return (
      "http://10.0.2.2:3000/api/workspace/" + workspaceId + "/energy/ai/ocr"
    );
  },

  //Quotation
  quotation: baseApi + "/misc/quotation",
  quotationById: baseApi + "/misc/quotation",

  //Lead Gen
  leadgen: baseApi + "/misc/lead-gen",
  leadgenSave: baseApi + "/misc/lead-gen/save",

  //Access Management
  accessManagement: baseApi + "/auth/access-management", // GET
  accessUser: baseApi + "/auth/access-management/user", // POST (upsert)
  accessUserById: baseApi + "/auth/access-management/user", // DELETE /user/:id
  accessRole: baseApi + "/auth/access-management/role", // POST (upsert)
  accessRoleById: baseApi + "/auth/access-management/role", // DELETE /role/:id
  accessPermission: baseApi + "/auth/access-management/permission", // POST (bulk upsert)
  accessPermissionById: baseApi + "/auth/access-management/permission", // DELETE /permission/:id

  //HireFlow
  hireflow: baseApi + "/hireflow",
  hireflowSummary: baseApi + "/hireflow/summary",
  hireflowJobs: baseApi + "/hireflow/jobs",
  hireflowJobById: baseApi + "/hireflow/jobs",
  hireflowCandidates: baseApi + "/hireflow/candidates",
  hireflowCandidateById: baseApi + "/hireflow/candidates",
  hireflowApplications: baseApi + "/hireflow/applications",
  hireflowDepartments: baseApi + "/hireflow/departments",
  hireflowDepartmentById: baseApi + "/hireflow/departments",
  hireflowInterviews: baseApi + "/hireflow/interviews",
  hireflowInterviewById: baseApi + "/hireflow/interviews",
  hireflowScorecards: baseApi + "/hireflow/scorecards",
  hireflowNotes: baseApi + "/hireflow/notes",
  hireflowOffers: baseApi + "/hireflow/offers",
  hireflowActivities: baseApi + "/hireflow/activities",
};
