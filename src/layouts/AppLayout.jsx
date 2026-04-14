import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

const AppLayout = () => {
  return (
    <div className="h-screen bg-slate-100 overflow-hidden">
      <div className="flex h-screen flex-col lg:flex-row">
        <Sidebar />
        <div className="flex h-full flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-10">
            <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-soft sm:p-8">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
