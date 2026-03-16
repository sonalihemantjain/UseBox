import { MessageSquare, BookOpen, GraduationCap, Settings, LogOut, Plus, Pencil, Trash2, Check, X, PanelLeftClose, PanelLeft, Bookmark, BookmarkCheck } from "lucide-react";
import { useState, useCallback } from "react";
import useBoxLogo from "@/assets/usebox-logo.png";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { RoleSelector } from "@/components/RoleSelector";
import { useChatHistory, type ChatSession } from "@/hooks/useChatHistory";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
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
  { title: "Share", url: "/knowledge", icon: BookOpen },
  { title: "Earn", url: "/earn", icon: GraduationCap },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { role, setRole } = useUserRole();
  const { chats, createChat, renameChat, deleteChat, toggleSaveChat } = useChatHistory();
  const isOnChat = location.pathname === "/chat";

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleNewChat = useCallback(() => {
    // Navigate to /chat without an id — the Chat page creates the DB entry on first message
    navigate("/chat");
    // Force a page-level reset by dispatching a custom event
    window.dispatchEvent(new Event("usebox-new-chat"));
  }, [navigate]);

  const startEdit = (chat: ChatSession) => {
    setEditingId(chat.id);
    setEditTitle(chat.title);
  };

  const confirmEdit = () => {
    if (editingId && editTitle.trim()) {
      renameChat(editingId, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <Sidebar collapsible="icon" className="border-r-0 [&_[data-sidebar=content]]:overflow-x-hidden">
      <SidebarHeader className={cn("p-3", collapsed && "p-1.5 flex items-center justify-center")}>
        <div className="flex items-center justify-between">
          <a href="/dashboard" className="flex items-center gap-2.5">
            <img src={useBoxLogo} alt="UseBox" className="h-8 w-8 shrink-0" />
            {!collapsed && (
              <span className="font-display text-lg font-bold tracking-tight text-sidebar-foreground">
                Use<span className="text-gradient-gold">Box</span>
              </span>
            )}
          </a>
          {!collapsed && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-sidebar-foreground/60 hover:text-sidebar-foreground" onClick={toggleSidebar}>
              <PanelLeftClose className="h-4 w-4" />
            </Button>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className={cn("px-2", collapsed && "px-0")}>
        {/* New Chat button */}
        {!collapsed && (
          <Button
            onClick={handleNewChat}
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 mb-2 border-sidebar-border text-sidebar-foreground bg-sidebar-accent/50 hover:bg-sidebar-accent"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
        )}

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="hover:bg-sidebar-accent/50 text-sidebar-foreground/70"
                      activeClassName="bg-sidebar-accent text-sidebar-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Chat History - always show when expanded */}
        {!collapsed && chats.length > 0 && (
          <>
            <Separator className="my-2 bg-sidebar-border" />
            <div className="px-1">
              <p className="text-[11px] font-medium text-sidebar-foreground/40 uppercase tracking-wider px-2 mb-1.5">Recent</p>
              <div className="space-y-0.5 max-h-[40vh] overflow-y-auto">
                {chats.slice(0, 20).map((chat) => (
                  <div
                    key={chat.id}
                    className={cn(
                      "group/chatitem flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] cursor-pointer transition-colors",
                      "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    )}
                    onClick={() => editingId !== chat.id && navigate(`/chat?id=${chat.id}`)}
                  >
                    {editingId === chat.id ? (
                      <div className="flex-1 flex items-center gap-1">
                        <input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && confirmEdit()}
                          className="flex-1 bg-transparent border-b border-primary outline-none text-sidebar-foreground text-[13px]"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                        <button onClick={(e) => { e.stopPropagation(); confirmEdit(); }} className="text-primary">
                          <Check className="h-3 w-3" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setEditingId(null); }} className="text-sidebar-foreground/40">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="flex-1 truncate">{chat.title}</span>
                        <div className="hidden group-hover/chatitem:flex items-center shrink-0">
                          <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleSaveChat(chat.id, !chat.saved); }}
                            className={cn("p-1 rounded", chat.saved ? "text-primary" : "hover:bg-sidebar-accent")}
                            title={chat.saved ? "Unsave" : "Save"}
                          >
                            {chat.saved ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteChat(chat.id); }}
                            className="p-1 rounded hover:bg-destructive/20 text-destructive"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <RoleSelector value={role} onChange={setRole as (r: import("@/hooks/useUserRole").UserRole | null) => void} collapsed={collapsed} />
      </SidebarContent>

      <SidebarFooter className="p-3">
        {collapsed && (
          <Button variant="ghost" size="icon" className="w-full h-8 text-sidebar-foreground/60 hover:text-sidebar-foreground mb-2" onClick={toggleSidebar}>
            <PanelLeft className="h-4 w-4" />
          </Button>
        )}
        {!collapsed && user && (
          <p className="text-xs text-sidebar-foreground/40 truncate px-2 mb-2">
            {user.email}
          </p>
        )}
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "sm"}
          onClick={handleSignOut}
          className={cn(
            "w-full text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
            collapsed ? "justify-center" : "justify-start"
          )}
        >
          <LogOut className={cn("h-4 w-4 shrink-0", !collapsed && "mr-2")} />
          {!collapsed && <span>Sign Out</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
