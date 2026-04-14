import { Route, Navigate, useParams } from "react-router-dom";
import Dashboard from "../pages/Dashboard";
import MyClaims from "../pages/MyClaims";
import ClaimDetails from "../pages/ClaimDetails";
import PendingApprovals from "../pages/PendingApprovals";
import CreateClaim from "../pages/CreateClaim";

const AppRoutes = () => {
  return (
    <>
      <Route path="/" element={<Dashboard />} />
      <Route path="/claims" element={<MyClaims />} />
      <Route path="/claims/new" element={<CreateClaim />} />
      <Route path="/claims/:id" element={<ClaimDetails />} />
      <Route path="/approvals" element={<PendingApprovals />} />
      <Route
        path="/pending-approvals"
        element={<Navigate to="/approvals" replace />}
      />
      <Route path="/claim-details/:id" element={<ClaimDetailsRedirect />} />
    </>
  );
};

const ClaimDetailsRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/claims/${id}`} replace />;
};

export default AppRoutes;
