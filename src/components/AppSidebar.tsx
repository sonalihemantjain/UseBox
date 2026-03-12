import { MessageSquare, BookOpen, GraduationCap, BarChart3, LogOut, BookmarkCheck } from "lucide-react";
import useBoxLogo from "@/assets/usebox-logo.png";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { RoleSelector } from "@/components/RoleSelector";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { title: "Learn", url: "/chat", icon: MessageSquare },
  { title: "Saved Chats", url: "/saved-chats", icon: BookmarkCheck },
  { title: "Share", url: "/knowledge", icon: BookOpen },
  { title: "Earn", url: "/learning", icon: GraduationCap },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { role, setRole } = useUserRole();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <Sidebar collapsible="icon" className="[&_[data-sidebar=content]]:overflow-x-hidden">
      <SidebarHeader className="p-4">
        <a href="/dashboard" className="flex items-center gap-2.5">
          <img src={useBoxLogo} alt="UseBox" className="h-9 w-9 shrink-0" />
          {!collapsed && (
            <span className="font-display text-xl font-bold tracking-tight text-foreground">
              Use<span className="text-gradient-gold">Box</span>
            </span>
          )}
        </a>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="hover:bg-muted/50"
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>


        <RoleSelector value={role} onChange={setRole as (r: import("@/hooks/useUserRole").UserRole | null) => void} collapsed={collapsed} />

      </SidebarContent>

      <SidebarFooter className="p-3">
        {!collapsed && user && (
          <p className="text-xs text-muted-foreground truncate px-2 mb-2">
            {user.email}
          </p>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="w-full justify-start text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4 mr-2 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
