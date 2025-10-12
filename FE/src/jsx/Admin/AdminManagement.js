import React, { useEffect, useState } from "react";
import SideBar from "../layouts/AdminSidebar/Sidebar";
import Log from "../../assets/images/img/log.jpg";
import {
  allUsersApi,
  bypassSingleUserApi,
  deleteEachUserApi,
  updateSignleUsersStatusApi,
} from "../../Api/Service";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuthUser } from "react-auth-kit";
import {
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Typography,
  Box,
  Grid,
  Button,
  Chip,
  LinearProgress,
  Stack
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
  ManageAccounts as ManageIcon,
  AdminPanelSettings as AdminIcon,
  CheckCircle as CheckIcon,
  Delete as DeleteIcon,
  VerifiedUser as VerifiedIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import "react-responsive-modal/styles.css";
import { Modal } from "react-responsive-modal";
import AdminHeader from "./adminHeader";

const AdminManagement = () => {
  const [Users, setUsers] = useState([]);
  const [unVerified, setunVerified] = useState([]);
  const [open, setOpen] = useState(false);
  const [modalData, setmodalData] = useState({});
  const [isDisable, setisDisable] = useState(false);
  const [isUsers, setisUsers] = useState(false);

  let authUser = useAuthUser();
  let Navigate = useNavigate();
  const [isLoading, setisLoading] = useState(true);

  const getAllUsers = async () => {
    try {
      // Fetch admins only with role filter
      const params = { role: 'admin', limit: 1000 };
      const allUsers = await allUsersApi(params);

      if (allUsers.success) {
        let filtered;
        let unverified;
        if (authUser().user.role === "superadmin") {
          filtered = allUsers.allUsers.filter((user) => {
            return user.role === "admin" && user.verified === true;
          });
          unverified = allUsers.allUsers.filter((user) => {
            return user.role === "admin" && user.verified === false;
          });
        } else if (authUser().user.role === "subadmin" || authUser().user.role === "admin") {
          Navigate('/admin/dashboard')
        }
        setUsers(filtered.reverse());
        setunVerified(unverified.reverse());
      } else {
        toast.dismiss();
        toast.error(allUsers.msg);
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error);
    } finally {
      setisLoading(false);
    }
  };

  const deleteEachUser = async (user) => {
    try {
      setisDisable(true);
      const allUsers = await deleteEachUserApi(user._id);

      if (allUsers.success) {
        toast.dismiss();
        toast.success(allUsers.msg);
        setOpen(false);
        getAllUsers();
      } else {
        toast.dismiss();
        toast.error(allUsers.msg);
        setOpen(false);
        getAllUsers();
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error);
    } finally {
      setisDisable(false);
    }
  };

  const bypassSingleUser = async (e) => {
    try {
      setisUsers(true);
      const signleUser = await bypassSingleUserApi(e._id);

      if (signleUser.success) {
        toast.dismiss();
        getAllUsers();
        toast.success(signleUser.msg);
      } else {
        toast.dismiss();
        toast.error(signleUser.msg);
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error);
    } finally {
      setisUsers(false);
    }
  };

  const onOpenModal = (user) => {
    setOpen(true);
    setmodalData(user);
  };

  const onCloseModal = () => setOpen(false);

  useEffect(() => {
    if (authUser().user.role === "user") {
      Navigate("/dashboard");
      return;
    }
    if (authUser().user.role === "admin") {
      Navigate("/admin/dashboard");
      return;
    }
    if (authUser().user.role === "subadmin") {
      Navigate("/admin/dashboard");
      return;
    }
    getAllUsers();
  }, []);

  const [Active, setActive] = useState(false);
  let toggleBar = () => {
    setActive(!Active);
  };

  const [disabledIn, setdisabledIn] = useState(false);
  const updateUserIsShared = async (userId, isShared) => {
    try {
      setdisabledIn(true);
      const updatedUser = await updateSignleUsersStatusApi(userId, {
        isShared,
      });
      if (updatedUser.success) {
        toast.success("User status updated successfully");
        getAllUsers();
      } else {
        toast.error(updatedUser.msg);
      }
    } catch (error) {
      toast.error("Error updating user status");
    } finally {
      setdisabledIn(false);
    }
  };

  // Dark Theme Styles
  const darkCardStyles = {
    background: 'linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%)',
    border: '1px solid #333',
    color: '#ffffff',
    '&:hover': {
      boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
      transform: 'translateY(-2px)'
    }
  };

  const AdminCard = ({ user, isUnverified = false }) => (
    <Card sx={{ ...darkCardStyles, borderRadius: 3, overflow: 'visible', position: 'relative' }}>
      {/* Verification Status Badge */}
      <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 2 }}>
        <Chip
          icon={isUnverified ? <WarningIcon /> : <VerifiedIcon />}
          label={isUnverified ? "Unverified" : "Verified"}
          color={isUnverified ? "warning" : "success"}
          size="small"
          variant="filled"
        />
      </Box>

      <CardHeader
        avatar={
          <Avatar
            src={Log}
            sx={{
              width: 60,
              height: 60,
              border: '3px solid',
              borderColor: isUnverified ? 'warning.main' : 'primary.main',
              bgcolor: isUnverified ? 'warning.dark' : 'primary.dark'
            }}
          >
            <AdminIcon />
          </Avatar>
        }
        title={
          <Typography variant="h6" fontWeight={600} sx={{ color: 'grey.100' }} noWrap>
            {user.firstName} {user.lastName}
          </Typography>
        }
        subheader={
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <EmailIcon sx={{ fontSize: 16, mr: 1, color: 'grey.400' }} />
              <Typography variant="body2" sx={{ color: 'grey.400' }} noWrap>
                {user.email}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CalendarIcon sx={{ fontSize: 14, mr: 1, color: 'grey.500' }} />
              <Typography variant="caption" sx={{ color: 'grey.500' }}>
                Registered: {new Date(user.createdAt).toLocaleDateString()}
              </Typography>
            </Box>
          </Box>
        }
        sx={{ pb: 1 }}
      />

      <CardContent>
        <Stack spacing={2}>
          {/* Action Buttons */}
          <Box>
            <Button
              component={Link}
              to={`/admin/user/${user._id}/general`}
              variant="outlined"
              fullWidth
              startIcon={<ManageIcon />}
              sx={{
                borderColor: 'primary.main',
                color: 'primary.main',
                mb: 1,
                '&:hover': {
                  backgroundColor: 'primary.dark',
                  borderColor: 'primary.light'
                }
              }}
            >
              Manage Admin
            </Button>

            <Button
              component={Link}
              to={`/admin/permissions/${user._id}`}
              variant="contained"
              fullWidth
              startIcon={<AdminIcon />}
              sx={{
                background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
                mb: 1,
                '&:hover': {
                  background: 'linear-gradient(45deg, #1565c0, #1e88e5)'
                }
              }}
            >
              Manage Permissions
            </Button>

            {/* Verify Email Button for Unverified Admins */}
            {isUnverified && (
              <Button
                disabled={isUsers}
                onClick={() => bypassSingleUser(user)}
                variant="contained"
                fullWidth
                startIcon={<CheckIcon />}
                sx={{
                  backgroundColor: 'warning.dark',
                  mb: 1,
                  '&:hover': {
                    backgroundColor: 'warning.main'
                  }
                }}
              >
                {isUsers ? 'Verifying...' : 'Verify Email'}
              </Button>
            )}

            {/* Delete Button for Superadmin */}
            {(authUser().user.role === "superadmin") && (
              <Button
                onClick={() => onOpenModal(user)}
                variant="outlined"
                fullWidth
                style={
                  {paddingBlock:"5px"}
                }
                startIcon={<DeleteIcon />}
                sx={{
                  borderColor: 'error.dark',
                  color: 'error.main',
                  '&:hover': {
                    backgroundColor: 'error.dark',
                    borderColor: 'error.light'
                  }
                }}
              >
                Delete Admin
              </Button>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );

  return (
    <div className="admin dark-theme dark-new-ui">
      <div className="bg-gray-900 min-h-screen">
        <SideBar state={Active} toggle={toggleBar} />
        <div className="bg-gray-900 relative min-h-screen w-full overflow-x-hidden px-4 transition-all duration-300 xl:px-10 lg:max-w-[calc(100%_-_280px)] lg:ms-[280px]">
          <div className="mx-auto w-full max-w-7xl">
            <AdminHeader toggle={toggleBar} pageName="Admin Management" />

            {isLoading ? (
              <Box sx={{ width: '100%', p: 4, textAlign: 'center' }}>
                <LinearProgress 
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    backgroundColor: 'grey.800',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: 'primary.main'
                    }
                  }} 
                />
                <Typography variant="h6" sx={{ mt: 2, color: 'grey.300' }}>
                  Loading Admins...
                </Typography>
              </Box>
            ) : (
              <Box sx={{ p: 3 }}>
               

                {/* Verified Admins Section */}
                <Box sx={{ mb: 6 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <VerifiedIcon sx={{ mr: 2, fontSize: 32, color: 'success.main' }} />
                    <Box>
                      <Typography variant="h4" fontWeight="700" gutterBottom sx={{ color: 'grey.100' }}>
                        Verified Admins
                      </Typography>
                      <Typography variant="subtitle1" sx={{ color: 'grey.400' }}>
                        {Users.length} admins with verified email addresses
                      </Typography>
                    </Box>
                  </Box>

                  <Grid container spacing={3}>
                    {Users.map((user, index) => (
                      <Grid item xs={12} sm={6} md={4} key={index}>
                        <AdminCard user={user} />
                      </Grid>
                    ))}
                  </Grid>
                </Box>

                {/* Unverified Admins Section */}
                {unVerified.length > 0 && (
                  <Box sx={{ mb: 6 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <WarningIcon sx={{ mr: 2, fontSize: 32, color: 'warning.main' }} />
                      <Box>
                        <Typography variant="h4" fontWeight="700" gutterBottom sx={{ color: 'grey.100' }}>
                          Unverified Admins
                        </Typography>
                        <Typography variant="subtitle1" sx={{ color: 'grey.400' }}>
                          {unVerified.length} admins pending email verification
                        </Typography>
                      </Box>
                    </Box>

                    <Grid container spacing={3}>
                      {unVerified.map((user, index) => (
                        <Grid item xs={12} sm={6} md={4} key={index}>
                          <AdminCard user={user} isUnverified={true} />
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}
              </Box>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal - Dark Theme */}
      <Modal 
        open={open} 
        onClose={onCloseModal} 
        center 
        styles={{ 
          modal: { 
            backgroundColor: '#1e1e1e', 
            border: '1px solid #333',
            borderRadius: '12px',
            padding: '0'
          } 
        }}
      >
        <Box sx={{ p: 4, maxWidth: 400, textAlign: 'center' }}>
          <DeleteIcon sx={{ fontSize: 64, mb: 2, color: 'error.main' }} />
          <Typography variant="h5" fontWeight="700" gutterBottom sx={{ color: 'grey.100' }}>
            Confirm Deletion
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, color: 'grey.400' }}>
            Are you sure you want to delete <strong style={{ color: 'grey.100' }}>{modalData.firstName} {modalData.lastName}</strong>? This action cannot be undone.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="outlined"
              onClick={onCloseModal}
              sx={{ 
                borderRadius: 2, 
                px: 4,
                color: 'grey.300',
                borderColor: 'grey.600',
                '&:hover': {
                  borderColor: 'grey.400'
                }
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={() => deleteEachUser(modalData)}
              disabled={isDisable}
              sx={{ borderRadius: 2, px: 4 }}
            >
              {isDisable ? 'Deleting...' : 'Delete'}
            </Button>
          </Box>
        </Box>
      </Modal>
    </div>
  );
};

export default AdminManagement;