import { MessageSquare, BookOpen, GraduationCap, FlaskConical, Settings, LogOut, Plus, Trash2, Check, X, PanelLeftClose, PanelLeft, Bookmark, BookmarkCheck, ChevronUp, ChevronDown, ClipboardCheck } from "lucide-react";
import { toast } from "sonner";
import { useState, useCallback, useEffect } from "react";
import useBoxLogo from "@/assets/usebox-logo.png";
import { NavLink } from "@/components/NavLink";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useChatHistory } from "@/hooks/useChatHistory";
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
  { title: "Assessment", url: "/assessment", icon: ClipboardCheck },
  { title: "Pages", url: "/saved-chats", icon: BookmarkCheck },
  { title: "Settings", url: "/settings", icon: Settings },
];
export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { chats, renameChat, deleteChat, toggleSaveChat, fetchChats, removeFromList } = useChatHistory();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [recentExpanded, setRecentExpanded] = useState(true);
  const [activeChatId, setActiveChatId] = useState<string | null>(
    () => localStorage.getItem("usebox_active_chat_id")
  );

  useEffect(() => {
    const handler = () => setActiveChatId(localStorage.getItem("usebox_active_chat_id"));
    window.addEventListener("usebox-active-chat-changed", handler);
    return () => window.removeEventListener("usebox-active-chat-changed", handler);
  }, []);

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

  const confirmEdit = () => {
    if (editingId && editTitle.trim()) {
      renameChat(editingId, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleDelete = useCallback((e: React.MouseEvent, chatId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const activeChatId = localStorage.getItem("usebox_active_chat_id");

    if (activeChatId === chatId) {
      removeFromList(chatId);
      navigate("/chat");
      window.dispatchEvent(new Event("usebox-new-chat"));

      let undone = false;
      const timer = setTimeout(() => {
        if (!undone) deleteChat(chatId);
      }, 5000);

      toast("Chat deleted", {
        duration: 5000,
        action: {
          label: "Undo",
          onClick: () => {
            undone = true;
            clearTimeout(timer);
            fetchChats();
            navigate(`/chat?id=${chatId}`);
          },
        },
      });
    } else {
      deleteChat(chatId);
    }
  }, [deleteChat, fetchChats, removeFromList, navigate]);

  return (
    <Sidebar collapsible="icon" className="border-r-0 [&_[data-sidebar=content]]:overflow-x-hidden">
      <SidebarHeader className={cn("p-3", collapsed && "p-1.5 flex items-center justify-center")}>
        <div className="flex items-center justify-between">
          <a href="/dashboard" className="flex items-center gap-2.5">
            <img src={useBoxLogo} alt="Usebox" className="h-8 w-8 shrink-0" />
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
                        activeChatId === chat.id
                          ? "bg-sidebar-accent text-sidebar-foreground font-medium"
                          : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
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
                              onClick={(e) => handleDelete(e, chat.id)}
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
