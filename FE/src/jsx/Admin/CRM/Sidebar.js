import React from 'react';
import {
    Box,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Typography,
    IconButton,
    Divider,
    Avatar,
} from '@mui/material';
import {
    ChevronLeft,
    ChevronRight,
    Dashboard,
    People,
    Description,
    Analytics,
    Message,
    CalendarToday,
    Settings,
    Help,
    Logout,
} from '@mui/icons-material';

import { useAuthUser, useSignOut } from "react-auth-kit";
import { Link, useNavigate } from 'react-router-dom';
import { logoutApi } from '../../../Api/Service';
import { toast } from 'react-toastify';
const Sidebar = ({ isCollapsed, setIsSidebarCollapsed }) => {
    let user = useAuthUser()
    let signOut = useSignOut();
    let Navigate=useNavigate()
    const menuItems = [
        { icon: <Dashboard />, label: 'Dashboard', active: false, link: "/admin/dashboard" },
        { icon: <People />, label: 'Leads', active: true, link: "/admin/dashboard/crm" },
        // { icon: <Description />, label: 'Reports', active: false },
        // { icon: <Analytics />, label: 'Analytics', active: false },
        // { icon: <Message />, label: 'Messages', active: false },
        // { icon: <CalendarToday />, label: 'Calendar', active: false },
    ];
    const isLoginOrLogout = async () => {
        try {
            const logout = await logoutApi();

            if (logout.success) {
                signOut();
                Navigate("/auth/login/crm");
                return;
            } else {
                toast.dismiss();
                toast.error(logout.msg);
            }
        } catch (error) {
            toast.dismiss();
            toast.error(error);
        } finally {
        }
    };
    const bottomMenuItems = [
        { icon: <Logout />, label: 'Logout', active: false },
    ];

    const drawerWidth = isCollapsed ? 80 : 280;

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: drawerWidth,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: drawerWidth,
                    boxSizing: 'border-box',
                    border: 'none',
                    boxShadow: '0 0 20px rgba(0,0,0,0.1)',
                    transition: 'width 0.3s ease',
                    //   position:'absolute'
                },
            }}
        >
            {/* Logo Section */}
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {!isCollapsed && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                                B
                            </Avatar>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                                BitBlaze
                            </Typography>
                        </Box>
                    )}
                    {isCollapsed && (
                        <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32, mx: 'auto' }}>
                            B
                        </Avatar>
                    )}
                    <IconButton
                        onClick={() => setIsSidebarCollapsed(!isCollapsed)}
                        size="small"
                        sx={{ color: 'text.secondary' }}
                    >
                        {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
                    </IconButton>
                </Box>
            </Box>

            {/* Navigation */}
            <Box sx={{ flex: 1, p: 1 }}>
                <List>
                    {menuItems.map((item, index) => (
                        <Link to={item.link} key={index} disablePadding sx={{ mb: 0.5 }}>
                            <ListItemButton
                                sx={{
                                    borderRadius: 2,
                                    backgroundColor: item.active ? 'primary.light' : 'transparent',
                                    color: item.active ? 'primary.main' : 'text.secondary',
                                    '&:hover': {
                                        backgroundColor: item.active ? 'primary.light' : 'action.hover',
                                    },
                                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                                    px: 2,
                                    py: 1.5,
                                }}
                            >
                                <ListItemIcon
                                    sx={{
                                        minWidth: 'auto',
                                        color: 'inherit',
                                        mr: isCollapsed ? 0 : 2,
                                    }}
                                >
                                    {item.icon}
                                </ListItemIcon>
                                {!isCollapsed && (
                                    <ListItemText
                                        primary={item.label}
                                        primaryTypographyProps={{
                                            fontSize: '0.875rem',
                                            fontWeight: item.active ? 600 : 400,
                                        }}
                                    />
                                )}
                            </ListItemButton>
                        </Link>
                    ))}
                </List>
            </Box>

            <Divider />

            {/* Bottom Navigation */}
            <Box sx={{ p: 1 }}>
                <List >
                    {bottomMenuItems.map((item, index) => (
                        <ListItem onClick={isLoginOrLogout}  key={index} disablePadding sx={{ mb: 0.5 }}>
                            <ListItemButton
                                sx={{
                                    borderRadius: 2,
                                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                                    px: 2,
                                    py: 1.5,
                                }}
                            >
                                <ListItemIcon
                                    sx={{
                                        minWidth: 'auto',
                                        color: 'text.secondary',
                                        mr: isCollapsed ? 0 : 2,
                                    }}
                                >
                                    {item.icon}
                                </ListItemIcon>
                                {!isCollapsed && (
                                    <ListItemText
                                        primary={item.label}
                                        primaryTypographyProps={{ fontSize: '0.875rem' }}
                                    />
                                )}
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
            </Box>

            {/* User Profile */}
            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                        {user().user.firstName.slice(0, 1)}
                    </Avatar>
                    {!isCollapsed && (
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                                {user().user.firstName}{" "}{user().user.lastName}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {user().user.email}
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Box>
        </Drawer>
    );
};

export default Sidebar;