import { MessageSquare, BookOpen, GraduationCap, FlaskConical, Settings, LogOut, Plus, Pencil, Trash2, Check, X, PanelLeftClose, PanelLeft, Bookmark, BookmarkCheck, ChevronUp, ChevronDown } from "lucide-react";
import { useState, useCallback } from "react";
import useBoxLogo from "@/assets/usebox-logo.png";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ROLE_LABELS, useUserRole, type UserRole } from "@/hooks/useUserRole";
import { useUserContextFilters } from "@/hooks/useUserContextFilters";
import { useContextFilterOptions } from "@/hooks/useContextFilterOptions";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const navItems = [
  { title: "Learn", url: "/chat", icon: MessageSquare },
  { title: "Share", url: "/knowledge", icon: BookOpen },
  { title: "Earn", url: "/earn", icon: GraduationCap },
  { title: "Lab", url: "/lab", icon: FlaskConical },
  { title: "Pages", url: "/saved-chats", icon: BookmarkCheck },
  { title: "Settings", url: "/settings", icon: Settings },
];
const roleOptions: UserRole[] = ["nocode", "lowcode", "prodeveloper", "architect", "admin"];
const ROLE_COLORS: Record<UserRole, string> = {
  nocode: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20",
  lowcode: "from-amber-500/10 to-amber-500/5 border-amber-500/20",
  prodeveloper: "from-blue-500/10 to-blue-500/5 border-blue-500/20",
  architect: "from-purple-500/10 to-purple-500/5 border-purple-500/20",
  admin: "from-red-500/10 to-red-500/5 border-red-500/20",
};

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { role, setRole } = useUserRole();
  const { functionalArea, industry, setFunctionalArea, setIndustry } = useUserContextFilters();
  const { functionalAreas, industries, loading: filtersLoading } = useContextFilterOptions();
  const { chats, createChat, renameChat, deleteChat, toggleSaveChat } = useChatHistory();
  const isOnChat = location.pathname === "/chat";

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [recentExpanded, setRecentExpanded] = useState(true);

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
                  {collapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton asChild>
                          <NavLink
                            to={item.url}
                            className="hover:bg-sidebar-accent/50 text-sidebar-foreground/70"
                            activeClassName="bg-sidebar-accent text-sidebar-foreground font-medium"
                          >
                            <item.icon className="h-4 w-4 shrink-0" />
                          </NavLink>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      <TooltipContent side="right">{item.title}</TooltipContent>
                    </Tooltip>
                  ) : (
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className="hover:bg-sidebar-accent/50 text-sidebar-foreground/70"
                        activeClassName="bg-sidebar-accent text-sidebar-foreground font-medium"
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  )}
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
              <button
                onClick={() => setRecentExpanded((v) => !v)}
                className="w-full flex items-center justify-between px-2 py-1 rounded-md text-[11px] font-medium text-sidebar-foreground/40 uppercase tracking-wider hover:bg-sidebar-accent/40 transition-colors"
              >
                <span>Recent</span>
                {recentExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronUp className="h-3 w-3" />
                )}
              </button>

              {recentExpanded && (
                <div className="space-y-0.5 max-h-[40vh] overflow-y-auto mt-1">
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
              )}
            </div>
          </>
        )}

      </SidebarContent>

      <SidebarFooter className={cn("p-3", collapsed && "p-1.5 items-center")}>
        {collapsed && (
          <Button variant="ghost" size="icon" className="w-full h-8 text-sidebar-foreground/60 hover:text-sidebar-foreground mb-2" onClick={toggleSidebar}>
            <PanelLeft className="h-4 w-4" />
          </Button>
        )}
        {!collapsed && (
          <p className="text-[10px] font-medium text-sidebar-foreground/40 uppercase tracking-wider px-2 mb-1">Persona</p>
        )}
        {!collapsed ? (
          <div className="px-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg bg-gradient-to-b border",
                    role
                      ? ROLE_COLORS[role]
                      : "from-muted/60 to-muted/20 border-dashed border-border",
                    "hover:opacity-90 transition-opacity"
                  )}
                >
                  <span className="text-xs font-semibold text-foreground truncate text-left">
                    {role ? ROLE_LABELS[role] : "Select Persona"}
                  </span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem onClick={() => setRole(null)}>
                  Select Persona
                </DropdownMenuItem>
                {roleOptions.map((r) => (
                  <DropdownMenuItem key={r} onClick={() => setRole(r)}>
                    {ROLE_LABELS[r]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="w-10 h-10 mx-auto rounded-lg border border-sidebar-border bg-sidebar-accent/30 flex items-center justify-center"
                title={role ? ROLE_LABELS[role] : "Select Persona"}
              >
                <ChevronDown className="h-3.5 w-3.5 text-sidebar-foreground/60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start" className="w-56">
              <DropdownMenuItem onClick={() => setRole(null)}>
                Select Persona
              </DropdownMenuItem>
              {roleOptions.map((r) => (
                <DropdownMenuItem key={r} onClick={() => setRole(r)}>
                  {ROLE_LABELS[r]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {!collapsed && (
          <div className="px-2 mt-2 space-y-2 max-h-[28vh] overflow-y-auto">
            <div>
              <p className="text-[10px] font-medium text-sidebar-foreground/40 uppercase tracking-wider mb-1">Functional Area</p>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      "w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg bg-gradient-to-b border",
                      "from-muted/60 to-muted/20 border-dashed border-border hover:opacity-90 transition-opacity"
                    )}
                  >
                    <span className="text-xs font-semibold text-foreground truncate text-left">
                      {functionalAreas.find((f) => f.key === functionalArea)?.display_name || "All Functional Areas"}
                    </span>
                    <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuItem onClick={() => setFunctionalArea(null)}>
                    All Functional Areas
                  </DropdownMenuItem>
                  {filtersLoading && functionalAreas.length === 0 && (
                    <DropdownMenuItem disabled>Loading...</DropdownMenuItem>
                  )}
                  {functionalAreas.map((opt) => (
                    <DropdownMenuItem key={opt.key} onClick={() => setFunctionalArea(opt.key)}>
                      {opt.display_name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div>
              <p className="text-[10px] font-medium text-sidebar-foreground/40 uppercase tracking-wider mb-1">Industry</p>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      "w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg bg-gradient-to-b border",
                      "from-muted/60 to-muted/20 border-dashed border-border hover:opacity-90 transition-opacity"
                    )}
                  >
                    <span className="text-xs font-semibold text-foreground truncate text-left">
                      {industries.find((i) => i.key === industry)?.display_name || "All Industries"}
                    </span>
                    <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuItem onClick={() => setIndustry(null)}>
                    All Industries
                  </DropdownMenuItem>
                  {filtersLoading && industries.length === 0 && (
                    <DropdownMenuItem disabled>Loading...</DropdownMenuItem>
                  )}
                  {industries.map((opt) => (
                    <DropdownMenuItem key={opt.key} onClick={() => setIndustry(opt.key)}>
                      {opt.display_name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}
        {!collapsed && <Separator className="my-2 bg-sidebar-border" />}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "w-full flex items-center gap-2 rounded-lg hover:bg-sidebar-accent/50 transition-colors",
                  collapsed ? "h-10 w-10 mx-auto justify-center" : "px-2 py-2 justify-between"
                )}
                title={collapsed ? (user.email || "Account") : undefined}
              >
                <span className={cn("text-xs text-sidebar-foreground/60 truncate", collapsed && "hidden")}>
                  {user.email ?? "Account"}
                </span>
                {!collapsed && <ChevronUp className="h-3.5 w-3.5 text-sidebar-foreground/40 shrink-0" />}
                {collapsed && <LogOut className="h-4 w-4 text-sidebar-foreground/50" />}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side={collapsed ? "right" : "top"} align={collapsed ? "start" : "end"} className="w-56">
              <div className="px-2 py-1.5 text-xs text-muted-foreground truncate">
                {user.email ?? "Account"}
              </div>
              <Separator className="my-1" />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
