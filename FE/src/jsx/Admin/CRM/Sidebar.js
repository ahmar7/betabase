import React, { useEffect } from 'react';
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
  Logout,
  Menu,
} from '@mui/icons-material';
import { useAuthUser, useSignOut } from "react-auth-kit";
import { Link, useNavigate } from 'react-router-dom';
import { logoutApi } from '../../../Api/Service';
import { toast } from 'react-toastify';

const Sidebar = ({ isCollapsed, setIsSidebarCollapsed, isMobileMenu, setisMobileMenu }) => {
  const user = useAuthUser();
  const signOut = useSignOut();
  const navigate = useNavigate();

  const menuItems = [
    { icon: <Dashboard />, label: 'Dashboard', link: "/admin/dashboard" },
    { icon: <People />, label: 'Leads', link: "/admin/dashboard/crm" },
  ];

  const bottomMenuItems = [
    { icon: <Logout />, label: 'Logout', onClick: () => handleLogout() },
  ];

  const handleLogout = async () => {
    try {
      const logout = await logoutApi();
      if (logout.success) {
        signOut();
        navigate("/auth/login/crm");
      } else {
        toast.error(logout.msg);
      }
    } catch (error) {
      toast.error(error.message || "Logout failed");
    }
  };

  const drawerWidth = isCollapsed ? 80 : 280;

  // Close sidebar automatically when screen width > 768px
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && isMobileMenu) {
        setisMobileMenu(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileMenu]);

  return (
    <Drawer
      variant={window.innerWidth < 768 ? "temporary" : "permanent"}
      open={window.innerWidth < 768 ? isMobileMenu : true}
      onClose={() => setisMobileMenu(false)}
      sx={{
        width: { xs: 280, md: drawerWidth },
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: { xs: 280, md: drawerWidth },
          boxSizing: 'border-box',
          border: 'none',
          boxShadow: '0 0 20px rgba(0,0,0,0.1)',
          transition: 'width 0.3s ease',
        },
      }}
    >
      {/* Header / Logo */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {!isCollapsed && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>B</Avatar>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                BitBlaze
              </Typography>
            </Box>
          )}
          {isCollapsed && (
            <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32, mx: 'auto' }}>B</Avatar>
          )}
          <Box>
            {/* Desktop collapse toggle */}
            <IconButton
              onClick={() => setIsSidebarCollapsed(!isCollapsed)}
              size="small"
              sx={{ color: 'text.secondary', display: { xs: 'none', md: 'inline-flex' } }}
            >
              {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
            </IconButton>
            {/* Mobile menu toggle */}
            <IconButton
              onClick={() => setisMobileMenu(false)}
              size="small"
              sx={{ color: 'text.secondary', display: { xs: 'inline-flex', md: 'none' } }}
            >
              <Menu />
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/* Menu Items */}
      <Box sx={{ flex: 1, p: 1 }}>
        <List>
          {menuItems.map((item, index) => (
            <ListItem key={index} disablePadding>
              <ListItemButton
                component={Link}
                to={item.link}
                sx={{
                  borderRadius: 2,
                  color: 'text.secondary',
                  '&:hover': { backgroundColor: 'action.hover' },
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
                      fontWeight: 500,
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>

      <Divider />

      {/* Bottom Section */}
      <Box sx={{ p: 1 }}>
        <List>
          {bottomMenuItems.map((item, index) => (
            <ListItem key={index} disablePadding onClick={item.onClick}>
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
            {user()?.user?.firstName?.[0] || 'U'}
          </Avatar>
          {!isCollapsed && (
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                {user()?.user?.firstName} {user()?.user?.lastName}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {user()?.user?.email}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
