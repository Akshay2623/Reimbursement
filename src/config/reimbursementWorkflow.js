export const SPECIAL_APPROVER_ID = 75;
export const FINANCE_USER_ID = 2;
export const DEFAULT_HR_USER_ID = 55;

export const CLAIM_TYPE_MAP = {
  Travel: 1,
  Meals: 2,
  Accommodation: 3,
  Equipment: 4,
  Food: 5,
};

export const getClaimTypeId = (label) => CLAIM_TYPE_MAP[label] || 0;

const normalizeStatus = (status) => (status ? status.toLowerCase() : "");

const getCurrentApproverId = (claim) =>
  claim?.CurrentApproverUserID ??
  claim?.CurrentApproverUserId ??
  claim?.PendingWithUserID ??
  claim?.PendingWithUserId ??
  claim?.ApproverUserID ??
  claim?.ApproverUserId ??
  claim?.PendingWithID ??
  claim?.NextApproverUserID ??
  claim?.NextApproverUserId ??
  claim?.CurrentApproverID ??
  null;

const isPendingForUser = (claim, currentUserId) =>
  Number(getCurrentApproverId(claim)) === Number(currentUserId);

export const canSubmitClaim = (claim, itemsCount) =>
  normalizeStatus(claim?.CurrentStatusName) === "draft" && itemsCount > 0;

export const canApproveManager = (claim, currentUserId) => {
  const status = normalizeStatus(claim?.CurrentStatusName);
  const managerId =
    claim?.ManagerUserID ??
    claim?.ManagerUserId ??
    claim?.ReportingManagerUserID ??
    claim?.ReportingManagerUserId ??
    claim?.ReportingManagerID ??
    claim?.ReportingManagerId ??
    claim?.ManagerID ??
    claim?.ManagerId ??
    null;
  if (isPendingForUser(claim, currentUserId)) return true;
  return (
    Number(managerId) === Number(currentUserId) &&
    (status.includes("manager") || status.includes("submitted"))
  );
};

export const canApproveSpecialApprover = (claim, currentUserId) => {
  const status = normalizeStatus(claim?.CurrentStatusName);
  return (
    Number(currentUserId) === SPECIAL_APPROVER_ID &&
    (status.includes("special") || isPendingForUser(claim, currentUserId))
  );
};

export const canApproveFinance = (claim, currentUserId) => {
  const status = normalizeStatus(claim?.CurrentStatusName);
  return (
    Number(currentUserId) === FINANCE_USER_ID &&
    (status.includes("finance") || isPendingForUser(claim, currentUserId))
  );
};

export const canApproveHR = (claim, currentUserId) => {
  const status = normalizeStatus(claim?.CurrentStatusName);
  const hrId = Number(claim?.HRUserID ?? DEFAULT_HR_USER_ID);
  return (
    Number(currentUserId) === hrId &&
    (status.includes("hr") || isPendingForUser(claim, currentUserId))
  );
};

export const canReject = (claim, currentUserId) => isPendingForUser(claim, currentUserId);

export const canSendBack = (claim, currentUserId) => isPendingForUser(claim, currentUserId);

export const canMarkPaid = (claim, currentUserId) => {
  const status = normalizeStatus(claim?.CurrentStatusName);
  return (
    Number(currentUserId) === FINANCE_USER_ID &&
    (status === "hr approved" || claim?.IsPaidEligible === true || claim?.PaidEligible === true)
  );
};
