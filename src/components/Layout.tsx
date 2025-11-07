import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Activity,
  LayoutDashboard,
  Users,
  Calendar,
  MapPin,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  BookOpen,
  CalendarClock,
  ClipboardCheck,
  BarChart3
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);

      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();
      
      if (profileData) {
        setProfile(profileData);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been successfully signed out."
    });
    navigate("/auth");
  };

  const navItems = profile?.role === "nurse" 
    ? [
        { icon: Calendar, label: "My Visits", path: "/visits" },
        { icon: ClipboardCheck, label: "Checklists", path: "/checklists" },
        { icon: BookOpen, label: "Training", path: "/training" },
      ]
    : [
        { icon: LayoutDashboard, label: "Dashboard", path: "/" },
        { icon: Users, label: "Patients", path: "/patients" },
        { icon: Calendar, label: "Visits", path: "/visits" },
        { icon: MapPin, label: "Dispatch", path: "/dispatch" },
        { icon: FileText, label: "Prescriptions", path: "/prescriptions" },
        { icon: ClipboardCheck, label: "Checklists", path: "/checklists" },
        ...(profile?.role === "admin" || profile?.role === "control_room" ? [{ icon: CalendarClock, label: "Roster", path: "/roster" }] : []),
        ...(profile?.role === "admin" ? [
          { icon: BarChart3, label: "Analytics", path: "/analytics" },
          { icon: Settings, label: "Users", path: "/users" }
        ] : []),
        { icon: BookOpen, label: "Training", path: "/training" },
      ];

  const isActive = (path: string) => location.pathname === path;

  if (!user) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            <span className="font-semibold">Hospital at Home</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-screen bg-card border-r border-border
          transition-transform duration-200 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 w-64
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="hidden lg:flex items-center gap-2 px-6 h-16 border-b border-border">
            <Activity className="h-6 w-6 text-primary" />
            <span className="font-semibold">Hospital at Home</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 mt-16 lg:mt-0 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-colors
                  ${isActive(item.path)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }
                `}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* User Info & Actions */}
          <div className="p-4 border-t border-border space-y-3">
            {profile && (
              <div className="px-3 py-2">
                <p className="text-sm font-medium">{profile.full_name}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {profile.role.replace("_", " ")}
                </p>
              </div>
            )}
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => navigate("/settings")}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;