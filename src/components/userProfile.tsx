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

interface UserType {
    user_name?: string;
    name?: string;    // vet stores 'name'
    sname?: string;   // shelter stores 'sname'
    role: string;
}

function getDisplayName(user: UserType): string {
    return user.user_name || user.name || user.sname || "User";
}


export default function UserProfileMenu() {
    const navigate = useNavigate();
    const { state } = useSidebar();
    const isCollapsed = state === "collapsed";
    const [user, setUser] = useState<UserType | null>(null);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
    }, []);

    const handleLogout = () => {
        setIsLoggingOut(true);
        // Clear all auth data
        ['user', 'access_token', 'token', 'role', 'user_id', 'farmerId',
         'vet_id', 'shelter_id', 'identifier', 'faadhar', 'vemail', 'semail',
         'inaph_id', 'user_name'].forEach(k => localStorage.removeItem(k));
        setTimeout(() => {
            navigate('/');
        }, 500);
    };

    const handleAccountInfo = () => {
        const role = (user?.role || "").toLowerCase();
        if (role === "farmer") navigate("/dashboard/account-info");
        else if (role === "vet") navigate("/vet-dashboard/account-info");
        else if (role === "shelter") navigate("/shelter-dashboard/account-info");
    };

    const handleSettings = () => {
        const role = (user?.role || "").toLowerCase();
        if (role === "farmer") navigate("/dashboard/settings");
        else if (role === "vet") navigate("/vet-dashboard/settings");
        else if (role === "shelter") navigate("/shelter-dashboard/settings");
    };

    const userMenuItems = [
        {
            title: "Account Info",
            icon: User,
            onClick: handleAccountInfo
        },
        {
            title: "Settings",
            icon: Settings,
            onClick: handleSettings
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
                                    {getDisplayName(user)}
                                </p>
                                <p className="text-xs italic text-muted-foreground capitalize">
                                    {user.role}
                                </p>
                            </div>
                        )}
                        {isCollapsed && (
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
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
