import { getStoredUserId } from "./auth";

const SPECIAL_APPROVER_ID = 75;
const FINANCE_USER_ID = 2;
const HR_USER_ID = 244;

const inferRole = (userId) => {
  if (!userId) return "employee";
  if (userId === SPECIAL_APPROVER_ID) return "specialApprover";
  if (userId === FINANCE_USER_ID) return "finance";
  if (userId === HR_USER_ID) return "hr";
  return "manager";
};

export const currentUser = {
  get userId() {
    return getStoredUserId();
  },
  get isAdmin() {
    return String(localStorage.getItem("isAdmin")).toLowerCase() === "true";
  },
  get role() {
    return inferRole(getStoredUserId());
  },
};
