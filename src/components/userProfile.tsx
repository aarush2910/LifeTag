import { LogOut, Settings, User } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    useSidebar
} from "../components/ui/sidebar";
import Spinner from "../components/ui/spinner";

export default function UserProfileMenu() {
    const navigate = useNavigate();
    const { state } = useSidebar();
    const isCollapsed = state === "collapsed";
    const [user, setUser] = useState(null);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
    }, []);

    const handleLogout = () => {
        setIsLoggingOut(true);
        localStorage.removeItem('user');
        setTimeout(() => {
            navigate('/');
        }, 500);
    };

    const userMenuItems = [
        {
            title: "Account Info",
            icon: User,
            onClick: () => navigate("/account-info")
        },
        {
            title: "Settings", 
            icon: Settings,
            onClick: () => console.log("Settings clicked")
        },
        {
            title: "Logout",
            icon: LogOut,
            onClick: handleLogout
        }
    ];

    if (!user) return null;

    return (
        <div className="mt-auto border-t border-sidebar-border">
            <SidebarGroup>
                <SidebarGroupContent>
                    {/* User Info Display */}
                    <div className={`px-2 py-3 ${isCollapsed ? 'text-center' : ''}`}>
                        {!isCollapsed && (
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-foreground truncate">
                                    {user.user_name}
                                </p>
                                <p className="text-xs italic text-muted-foreground capitalize">
                                    {user.role}
                                </p>
                            </div>
                        )}
                        {isCollapsed && (
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-4 w-4" />
                            </div>
                        )}
                    </div>
                    
                    {/* User Menu Items */}
                    <SidebarMenu>
                        {userMenuItems.map((item) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton
                                    onClick={item.onClick}
                                    tooltip={isCollapsed ? item.title : undefined}
                                    className="w-full justify-start"
                                    disabled={item.title === "Logout" && isLoggingOut}
                                >
                                    <div className="flex items-center gap-3">
                                        {item.title === "Logout" && isLoggingOut ? (
                                            <>
                                                <Spinner size={16} />
                                                {!isCollapsed && (
                                                    <span className="truncate text-sm">Logging out...</span>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                <item.icon className="h-4 w-4 shrink-0" />
                                                {!isCollapsed && (
                                                    <span className="truncate text-sm">{item.title}</span>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroupContent>
            </SidebarGroup>
        </div>
    );
}
