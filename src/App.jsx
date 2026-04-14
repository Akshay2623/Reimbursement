import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import MyClaims from "./pages/MyClaims";
import CreateClaim from "./pages/CreateClaim";
import ClaimDetails from "./pages/ClaimDetails";
import PendingApprovals from "./pages/PendingApprovals";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<AppLayout />}>
          <Route element={<ProtectedRoute />}>
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
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

const ClaimDetailsRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/claims/${id}`} replace />;
};

export default App;
