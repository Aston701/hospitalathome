import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Auth from "./pages/Auth";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import NewPatient from "./pages/NewPatient";
import PatientDetail from "./pages/PatientDetail";
import Visits from "./pages/Visits";
import NewVisit from "./pages/NewVisit";
import VisitDetail from "./pages/VisitDetail";
import Dispatch from "./pages/Dispatch";
import Prescriptions from "./pages/Prescriptions";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import TrainingManuals from "./pages/TrainingManuals";
import Roster from "./pages/Roster";
import Checklists from "./pages/Checklists";
import Analytics from "./pages/Analytics";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <BrowserRouter>
        <Toaster />
        <Sonner />
        <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/" element={<Layout />}>
          <Route index element={
            <ProtectedRoute allowedRoles={["admin", "control_room", "doctor"]}>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="patients" element={
            <ProtectedRoute allowedRoles={["admin", "control_room", "doctor"]}>
              <Patients />
            </ProtectedRoute>
          } />
          <Route path="patients/new" element={
            <ProtectedRoute allowedRoles={["admin", "control_room"]}>
              <NewPatient />
            </ProtectedRoute>
          } />
          <Route path="patients/:id" element={
            <ProtectedRoute allowedRoles={["admin", "control_room", "doctor"]}>
              <PatientDetail />
            </ProtectedRoute>
          } />
          <Route path="visits" element={<Visits />} />
          <Route path="visits/new" element={
            <ProtectedRoute allowedRoles={["admin", "control_room"]}>
              <NewVisit />
            </ProtectedRoute>
          } />
          <Route path="visits/:id" element={<VisitDetail />} />
          <Route path="dispatch" element={
            <ProtectedRoute allowedRoles={["admin", "control_room"]}>
              <Dispatch />
            </ProtectedRoute>
          } />
          <Route path="prescriptions" element={
            <ProtectedRoute allowedRoles={["admin", "control_room", "doctor"]}>
              <Prescriptions />
            </ProtectedRoute>
          } />
          <Route path="roster" element={
            <ProtectedRoute allowedRoles={["admin", "control_room"]}>
              <Roster />
            </ProtectedRoute>
          } />
          <Route path="users" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Users />
            </ProtectedRoute>
          } />
          <Route path="checklists" element={
            <ProtectedRoute allowedRoles={["nurse", "admin", "control_room"]}>
              <Checklists />
            </ProtectedRoute>
          } />
          <Route path="analytics" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Analytics />
            </ProtectedRoute>
          } />
          <Route path="settings" element={<Settings />} />
          <Route path="training" element={<TrainingManuals />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      </BrowserRouter>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
