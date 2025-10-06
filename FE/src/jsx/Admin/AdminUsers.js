import React, { useEffect, useState, useCallback, useMemo } from "react";
import SideBar from "../layouts/AdminSidebar/Sidebar";
import { FiberManualRecord as DotIcon } from '@mui/icons-material';

import Log from "../../assets/images/img/log.jpg";
import {
  allUsersApi,
  bypassSingleUserApi,
  deleteEachUserApi,
  updateSignleUsersStatusApi,
  adminTicketsApi,
  addUserByEmailApi
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
  Switch,
  FormControlLabel,
  IconButton,
  Divider,
  CardActions,
  Badge,
  LinearProgress,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
  ManageAccounts as ManageIcon,
  ContactMail as ContactIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckIcon,
  VerifiedUser as VerifiedIcon,
  Warning as WarningIcon,
  Support as SupportIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import "react-responsive-modal/styles.css";
import { Modal } from "react-responsive-modal";
import AdminHeader from "./adminHeader";

// Memoized UserCard component to prevent unnecessary re-renders
const UserCard = React.memo(({
  user,
  isUnverified = false,
  onDelete,
  onVerify,
  onUpdateShared,
  onChangeNavigation,
  userTicketsCount,
  subadmins,
  disabledIn,
  isUsers,
  authUser
}) => {
  const getSubadminName = useCallback((subadminId) => {
    const subadmin = subadmins.find(sub => sub._id === subadminId);
    return subadmin ? `${subadmin.firstName} ${subadmin.lastName}` : "Unknown Subadmin";
  }, [subadmins]);

  const openedTicketsCount = userTicketsCount[user._id] || 0;

  const renderAssignmentInfo = useCallback((user) => {
    if (user.isShared) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, p: 1.5, bgcolor: 'primary.dark', borderRadius: 2 }}>
          <ShareIcon sx={{ mr: 1, color: 'primary.light' }} />
          <Box>
            <Typography variant="subtitle2" fontWeight="600" color="primary.light">
              Shared with all subadmins
            </Typography>
            <Typography variant="caption" color="primary.300">
              Accessible to every subadmin
            </Typography>
          </Box>
        </Box>
      );
    } else if (user.assignedSubAdmin) {
      const subadminName = getSubadminName(user.assignedSubAdmin);
      return (
        <Button
          component={Link}
          to={`/admin/subadmin/users/${user.assignedSubAdmin}`}
          startIcon={<AssignmentIcon />}
          variant="outlined"
          color="success"
          size="small"
          sx={{
            mb: 2,
            width: '100%',
            justifyContent: 'flex-start',
            textTransform: 'none',
            p: 1.5,
            borderColor: 'success.dark',
            backgroundColor: 'success.dark',
            color: 'success.light',
            '&:hover': {
              backgroundColor: 'success.main',
              borderColor: 'success.light'
            }
          }}
        >
          <Box textAlign="left">
            <Typography variant="subtitle2" color="lightgray" fontWeight="600">
              Assigned to
            </Typography>
            <Typography variant="caption" color="lightgray" display="block">
              {subadminName}
            </Typography>
          </Box>
        </Button>
      );
    } else {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, p: 1.5, bgcolor: 'grey.800', borderRadius: 2 }}>
          <WarningIcon sx={{ mr: 1, color: 'grey.500' }} />
          <Box>
            <Typography variant="subtitle2" fontWeight="600" color="grey.400">
              Not assigned
            </Typography>
            <Typography variant="caption" color="grey.500">
              No subadmin assigned
            </Typography>
          </Box>
        </Box>
      );
    }
  }, [getSubadminName]);

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: 'translateY(-8px)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        borderRadius: 4,
        overflow: 'visible',
        border: '1px solid',
        borderColor: 'grey.800',
        background: 'linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%)',
        '&:hover': {
          boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
          transform: 'translateY(-4px)'
        }
      }}
    >
      {/* Verification Status Ribbon */}
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 2
        }}
      >
        <Badge
          badgeContent={
            user.verified ? (
              <VerifiedIcon sx={{ fontSize: 16, color: 'success.main' }} />
            ) : (
              <WarningIcon sx={{ fontSize: 16, color: 'warning.main' }} />
            )
          }
        >
          <Avatar
            src={Log}
            sx={{
              width: 70,
              height: 70,
              border: '4px solid',
              borderColor: 'grey.900',
              boxShadow: 3,
              bgcolor: user.verified ? 'success.dark' : 'warning.dark'
            }}
          >
            <PersonIcon />
          </Avatar>
        </Badge>
      </Box>

      {/* Card Header */}
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="h6" fontWeight="700" sx={{
              background: 'linear-gradient(45deg, #64b5f6, #42a5f5)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              {user.firstName} {user.lastName}
            </Typography>
            {user.online ? (
              <div style={{
                color: 'green', backgroundColor: "green", width: "8px", height: "8px", borderRadius: "50%"
                , boxShadow: '0 0 8px rgba(76, 175, 80, 0.7)', animation: 'pulse 2s infinite green'
              }}
              >
              </div>
            ) : ""}
          </Box>
        }
        subheader={
          <Box Box sx={{ mt: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <EmailIcon sx={{ fontSize: 16, mr: 1, color: 'grey.400' }} />
              <Typography variant="body2" color="grey.400" noWrap>
                {user.email}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CalendarIcon sx={{ fontSize: 14, mr: 1, color: 'grey.500' }} />
              <Typography variant="caption" color="grey.500">
                Joined {new Date(user.createdAt).toLocaleDateString()}
              </Typography>
            </Box>
            {user.online ?
              <OnlineStatus isOnline={user.online || null} /> :

              <Typography style={{ display: 'flex' }} variant="caption" color="grey.500">

                Last Online:<OnlineStatus isOnline={user.online || null} lastOnline={user.lastOnline || null} />
              </Typography>
            }
            {
              openedTicketsCount > 0 && (
                <Chip
                  icon={<SupportIcon />}
                  label={`${openedTicketsCount} Open Ticket${openedTicketsCount > 1 ? 's' : ''}`}
                  size="small"
                  color="error"
                  variant="filled"
                  sx={{
                    fontSize: '0.7rem',
                    height: '24px',
                    marginTop: "10px",
                    backgroundColor: 'error.dark',
                    color: 'white'
                  }}
                />
              )
            }
          </Box >

        }
        sx={{
          pt: 3,
          pb: 1,
          '& .MuiCardHeader-content': {
            overflow: 'hidden'
          }
        }}
      />

      < Divider sx={{ mx: 2, bgcolor: 'grey.700' }} />

      < CardContent sx={{ flexGrow: 1, pt: 2 }}>
        {/* Assignment Information */}
        {
          (authUser.role === "admin" || authUser.role === "superadmin") && (
            <>
              {renderAssignmentInfo(user)}
              <Box sx={{ mb: 2, p: 1.5, bgcolor: 'grey.800', borderRadius: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={user.isShared || false}
                      onChange={(e) => onUpdateShared(user._id, e.target.checked)}
                      disabled={disabledIn}
                      color="primary"
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: 'primary.main',
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: 'primary.main',
                        },
                      }}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="subtitle2" fontWeight="600" color="grey.200">
                        Global Sharing
                      </Typography>
                      <Typography variant="caption" color="grey.400">
                        Share with all subadmins
                      </Typography>
                    </Box>
                  }
                  sx={{ width: '100%', mx: 0 }}
                />
              </Box>
            </>
          )
        }
      </CardContent >

      <Divider sx={{ mx: 2, bgcolor: 'grey.700' }} />

      {/* Action Buttons */}
      <CardActions sx={{ p: 2, gap: 1 }}>
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          width: '100%'
        }}>
          {/* First Row - Always visible buttons */}
          <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
            <Button
              component={Link}
              to={onChangeNavigation ? `/admin/users/${user._id}/assets` : `/admin/user/${user._id}/general`}
              variant="contained"
              startIcon={<ManageIcon />}
              size="small"
              sx={{
                flex: 1,
                borderRadius: 3,
                textTransform: 'none',
                fontWeight: '600',
                py: 1,
                minHeight: '40px',
                background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
                boxShadow: '0 4px 15px rgba(25, 118, 210, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1565c0, #1e88e5)'
                }
              }}
            >
              Manage
            </Button>

            <Button
              component={Link}
              to={`/admin/createTicket/${user._id}/${user.email}`}
              variant="outlined"
              startIcon={<ContactIcon />}
              style={{ color: 'white' }}
              size="small"
              sx={{
                flex: 1,
                borderRadius: 3,
                textTransform: 'none',
                fontWeight: '500',
                py: 1,
                minHeight: '40px',
                borderColor: 'secondary.main',
                color: 'secondary.main',
                '&:hover': {
                  backgroundColor: 'secondary.dark',
                  borderColor: 'secondary.light',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              Contact
            </Button>
          </Box>

          {/* Second Row - Conditional buttons */}
          <Box sx={{ display: 'flex', gap: 1, width: '100%', flexDirection: 'column' }}>
            {/* Verify Email Button */}
            {isUnverified && (
              <Button
                variant="contained"
                color="warning"
                startIcon={<CheckIcon />}
                size="small"
                disabled={isUsers}
                onClick={() => onVerify(user)}
                sx={{
                  width: '100%',
                  borderRadius: 3,
                  textTransform: 'none',
                  fontWeight: '600',
                  py: 1,
                  minHeight: '40px',
                  backgroundColor: 'warning.dark',
                  '&:hover': {
                    backgroundColor: 'warning.main'
                  }
                }}
              >
                Verify Email
              </Button>
            )}

            {/* Delete Button */}
            {(authUser.role === "admin" || authUser.role === "superadmin") && (
              <Button
                variant="outlined"
                color="primary.light"
                style={{ color: 'white' }}
                startIcon={<DeleteIcon />}
                size="small"
                onClick={() => onDelete(user)}
                sx={{
                  width: '100%',
                  borderRadius: 3,
                  textTransform: 'none',
                  fontWeight: '500',
                  py: 1,
                  minHeight: '40px',
                  borderWidth: 2,
                  borderColor: 'error.dark',
                  '&:hover': {
                    borderWidth: 2,
                    backgroundColor: 'error.dark',
                    borderColor: 'error.light'
                  }
                }}
              >
                Delete
              </Button>
            )}
          </Box>
        </Box>
      </CardActions>
    </Card >
  );
});
const formatLastOnline = (lastOnline) => {
  if (!lastOnline) return 'Never';

  const now = new Date();
  const lastOnlineDate = new Date(lastOnline);
  const diffInMs = now - lastOnlineDate;
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return lastOnlineDate.toLocaleDateString();
};

// Online Status Indicator Component
const OnlineStatus = ({ isOnline, lastOnline }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <DotIcon
        sx={{
          fontSize: 12,
          color: isOnline ? 'success.main' : 'grey.500',
          filter: isOnline ? 'drop-shadow(0 0 4px rgba(76, 175, 80, 0.5))' : 'none'
        }}
      />
      <Typography
        variant="caption"
        sx={{
          color: isOnline ? 'success.main' : 'grey.500',
          fontWeight: isOnline ? 600 : 400
        }}
      >
        {isOnline ? 'Online' : formatLastOnline(lastOnline)}
      </Typography>
    </Box>
  );
};
const AdminUsers = () => {
  const [Users, setUsers] = useState([]);
  const [unVerified, setunVerified] = useState([]);
  const [open, setOpen] = useState(false);
  const [modalData, setmodalData] = useState({});
  const [isDisable, setisDisable] = useState(false);
  const [isUsers, setisUsers] = useState(false);
  const [subadmins, setSubadmins] = useState([]);
  const [active, setActive] = useState(false);
  const [disabledIn, setdisabledIn] = useState(false);
  const [isLoading, setisLoading] = useState(true);
  const [changeNavigation, setchangeNavigation] = useState(false);
  const [userTicketsCount, setUserTicketsCount] = useState({});

  // New state for assign user modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignEmail, setAssignEmail] = useState("");
  const [selectedSubadmin, setSelectedSubadmin] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [subadminError, setSubadminError] = useState("");

  const authUser = useAuthUser();
  const Navigate = useNavigate();
  const currentAuthUser = authUser();

  // Memoize filtered subadmins
  const filteredSubadmins = useMemo(() =>
    subadmins.filter(subadmin => subadmin.role.includes("subadmin")),
    [subadmins]
  );

  // Fetch tickets with useCallback to prevent recreation
  const fetchTickets = useCallback(async () => {
    try {
      const allTickets = await adminTicketsApi();

      if (allTickets.success) {
        const ticketsCount = {};
        allTickets.tickets.forEach(ticket => {
          if (ticket.status === 'open' || ticket.status === 'opened') {
            ticketsCount[ticket.user] = (ticketsCount[ticket.user] || 0) + 1;
          }
        });
        setUserTicketsCount(ticketsCount);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    }
  }, []);

  // Optimized getAllUsers function
  const [isAssignUser, setisAssignUser] = useState(false);
  const getAllUsers = useCallback(async () => {
    try {
      const allUsers = await allUsersApi();

      if (!allUsers.success) {
        toast.error(allUsers.msg);
        return;
      }

      const currentUser = currentAuthUser.user;
      const allSubadmins = allUsers.allUsers.filter(user => user.role.includes("subadmin"));
      setSubadmins(allSubadmins);

      let filtered = [];
      let unverified = [];

      if (currentUser.role === "admin") {
        const filterAdmin = allUsers.allUsers.find(user => currentUser._id === user._id);

        setisAssignUser(filterAdmin?.adminPermissions?.isAddUsersToSubAdmin)
      }
      if (currentUser.role === "admin" || currentUser.role === "superadmin") {
        filtered = allUsers.allUsers.filter(user =>
          user.role.includes("user") && user.verified === true
        );
        unverified = allUsers.allUsers.filter(user =>
          user.role.includes("user") && user.verified === false
        );
      } else if (currentUser.role === "subadmin") {
        const filterSubadmin = allUsers.allUsers.find(user => currentUser._id === user._id);

        setchangeNavigation(!filterSubadmin?.permissions?.editUserProfile);

        filtered = allUsers.allUsers.filter(user =>
          user.role === "user" && user.verified === true &&
          (user.isShared === true || user.assignedSubAdmin === currentUser._id)
        );

        unverified = allUsers.allUsers.filter(user =>
          user.role === "user" && user.verified === false &&
          (user.isShared === true || user.assignedSubAdmin === currentUser._id)
        );
      }

      setUsers(filtered.reverse());
      setunVerified(unverified.reverse());
    } catch (error) {
      toast.error(error.message || "Error fetching users");
    }
  }, [currentAuthUser]);

  // Event handlers with useCallback
  const deleteEachUser = useCallback(async (user) => {
    try {
      setisDisable(true);
      const allUsers = await deleteEachUserApi(user._id);
      if (allUsers.success) {
        toast.success(allUsers.msg);
        setOpen(false);
        await getAllUsers();
      } else {
        toast.error(allUsers.msg);
        setOpen(false);
      }
    } catch (error) {
      toast.error(error.message || "Error deleting user");
    } finally {
      setisDisable(false);
    }
  }, [getAllUsers]);

  const bypassSingleUser = useCallback(async (user) => {
    try {
      setisUsers(true);
      const signleUser = await bypassSingleUserApi(user._id);
      if (signleUser.success) {
        await getAllUsers();
        toast.success(signleUser.msg);
      } else {
        toast.error(signleUser.msg);
      }
    } catch (error) {
      toast.error(error.message || "Error verifying user");
    } finally {
      setisUsers(false);
    }
  }, [getAllUsers]);

  const updateUserIsShared = useCallback(async (userId, isShared) => {
    try {
      setdisabledIn(true);
      const updatedUser = await updateSignleUsersStatusApi(userId, { isShared });
      if (updatedUser.success) {
        toast.success("User status updated successfully");
        await getAllUsers();
      } else {
        toast.error(updatedUser.msg);
      }
    } catch (error) {
      toast.error("Error updating user status");
    } finally {
      setdisabledIn(false);
    }
  }, [getAllUsers]);

  const onOpenModal = useCallback((user) => {
    setOpen(true);
    setmodalData(user);
  }, []);

  const onCloseModal = useCallback(() => setOpen(false), []);

  // Assign modal functions
  const openAssignModal = useCallback(() => {
    setAssignModalOpen(true);
    setAssignEmail("");
    setSelectedSubadmin("");
    setEmailError("");
    setSubadminError("");
  }, []);

  const closeAssignModal = useCallback(() => {
    setAssignModalOpen(false);
    setAssignEmail("");
    setSelectedSubadmin("");
    setEmailError("");
    setSubadminError("");
    setIsAssigning(false);
  }, []);

  const validateEmail = useCallback((email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, []);

  const handleAssignUser = useCallback(async () => {
    setEmailError("");
    setSubadminError("");

    let isValid = true;
    if (!assignEmail.trim()) {
      setEmailError("Email is required");
      isValid = false;
    } else if (!validateEmail(assignEmail)) {
      setEmailError("Please enter a valid email address");
      isValid = false;
    }

    if (!selectedSubadmin) {
      setSubadminError("Please select a subadmin");
      isValid = false;
    }

    if (!isValid) return;

    setIsAssigning(true);
    try {
      const body = { email: assignEmail, id: selectedSubadmin };
      const response = await addUserByEmailApi(body);

      if (response.success) {
        toast.success("User assigned to subadmin successfully");
        closeAssignModal();
        await getAllUsers();
      } else {
        toast.error(response.msg || "Failed to assign user to subadmin");
      }
    } catch (error) {
      toast.error("Error assigning user to subadmin");
      console.error("Assignment error:", error);
    } finally {
      setIsAssigning(false);
    }
  }, [assignEmail, selectedSubadmin, validateEmail, getAllUsers, closeAssignModal]);

  const toggleBar = useCallback(() => setActive(prev => !prev), []);

  // Initial data loading
  useEffect(() => {
    if (currentAuthUser.user.role === "user") {
      Navigate("/dashboard");
      return;
    }

    const loadData = async () => {
      setisLoading(true);
      try {
        await Promise.all([getAllUsers(), fetchTickets()]);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setisLoading(false);
      }
    };

    loadData();
  }, [currentAuthUser, Navigate, getAllUsers, fetchTickets]);

  // Render loading state
  if (isLoading) {
    return (
      <div className="admin dark-new-ui">
        <div className="bg-gray-900 min-h-screen">
          <SideBar state={active} toggle={toggleBar} />

          <AdminHeader toggle={toggleBar} pageName="Users Management" />
          <div className="bg-gray-900 relative min-h-screen w-full overflow-x-hidden px-4 transition-all duration-300 xl:px-10 lg:max-w-[calc(100%_-_280px)] lg:ms-[280px]">
            <Box sx={{ width: '100%', p: 4 }}>
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
              <Typography variant="h6" align="center" sx={{ mt: 2, color: 'grey.300' }}>
                Loading users...
              </Typography>
            </Box>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin dark-new-ui">
      <div className="bg-gray-900 min-h-screen">
        <SideBar state={active} toggle={toggleBar} />
        <div className="bg-gray-900 relative min-h-screen w-full overflow-x-hidden px-4 transition-all duration-300 xl:px-10 lg:max-w-[calc(100%_-_280px)] lg:ms-[280px]">
          <div className="mx-auto w-full max-w-7xl">
            <AdminHeader toggle={toggleBar} pageName="Users Management" />

            <Box sx={{ p: 3 }}>
              {/* Verified Users Section */}
              <Box sx={{ mb: 6 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, justifyContent: "space-between" }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <VerifiedIcon sx={{ mr: 2, fontSize: 32, color: 'success.main' }} />
                    <Box>
                      <Typography variant="h4" fontWeight="700" gutterBottom sx={{ color: 'grey.100' }}>
                        Verified Users
                      </Typography>
                      <Typography variant="subtitle1" sx={{ color: 'grey.400' }}>
                        {Users.length} users with verified email addresses
                      </Typography>
                    </Box>
                  </Box>
                  {
                    currentAuthUser.user.role === "superadmin" ||
                      currentAuthUser.user.role === "admin" && isAssignUser ? <Button
                        variant="contained"
                        startIcon={<AssignmentIcon />}
                        style={{ color: "white", background: "linear-gradient(45deg, #1976d2, #42a5f5)", paddingInline: "12px" }}
                        onClick={openAssignModal}
                        sx={{
                          borderRadius: 3,
                          textTransform: 'none',
                          fontWeight: '600',
                          py: 1,
                          minHeight: '40px',
                          background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
                          boxShadow: '0 4px 15px rgba(25, 118, 210, 0.3)',
                          '&:hover': {
                            background: 'linear-gradient(45deg, #1565c0, #1e88e5)'
                          }
                        }}
                      >
                      Assign User to Subadmin
                    </Button> : ""


                  }
                </Box>

                <Grid container spacing={3}>
                  {Users.map((user) => (
                    <Grid item xs={12} sm={6} md={4} key={user._id}>
                      <UserCard
                        user={user}
                        onDelete={onOpenModal}
                        onVerify={bypassSingleUser}
                        onUpdateShared={updateUserIsShared}
                        onChangeNavigation={changeNavigation}
                        userTicketsCount={userTicketsCount}
                        subadmins={subadmins}
                        disabledIn={disabledIn}
                        isUsers={isUsers}
                        authUser={currentAuthUser.user}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>

              {/* Unverified Users Section */}
              {unVerified.length > 0 && (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <WarningIcon sx={{ mr: 2, fontSize: 32, color: 'warning.main' }} />
                    <Box>
                      <Typography variant="h4" fontWeight="700" gutterBottom sx={{ color: 'grey.100' }}>
                        Unverified Users
                      </Typography>
                      <Typography variant="subtitle1" sx={{ color: 'grey.400' }}>
                        {unVerified.length} users pending email verification
                      </Typography>
                    </Box>
                  </Box>

                  <Grid container spacing={3}>
                    {unVerified.map((user) => (
                      <Grid item xs={12} sm={6} md={4} key={user._id}>
                        <UserCard
                          user={user}
                          isUnverified={true}
                          onDelete={onOpenModal}
                          onVerify={bypassSingleUser}
                          onUpdateShared={updateUserIsShared}
                          onChangeNavigation={changeNavigation}
                          userTicketsCount={userTicketsCount}
                          subadmins={subadmins}
                          disabledIn={disabledIn}
                          isUsers={isUsers}
                          authUser={currentAuthUser.user}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </Box>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal - Dark Theme */}
      <Modal open={open} onClose={onCloseModal} center styles={{ modal: { backgroundColor: '#1e1e1e', border: '1px solid #333' } }}>
        <Box sx={{ p: 4, maxWidth: 400, textAlign: 'center' }}>
          <WarningIcon sx={{ fontSize: 64, mb: 2, color: 'error.main' }} />
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
              sx={{ borderRadius: 2, px: 4 }}
              onClick={() => deleteEachUser(modalData)}
              disabled={isDisable}
            >
              {isDisable ? 'Deleting...' : 'Delete'}
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Assign User to Subadmin Modal */}
      <Dialog
        open={assignModalOpen}
        onClose={closeAssignModal}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#1e1e1e',
            backgroundImage: 'none',
            border: '1px solid #333',
            borderRadius: 3
          }
        }}
      >
        <DialogTitle sx={{
          bgcolor: 'grey.900',
          borderBottom: '1px solid #333',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Typography variant="h6" fontWeight="600" sx={{ color: 'grey.100' }}>
            Assign User to Subadmin
          </Typography>
          <IconButton onClick={closeAssignModal} sx={{ color: 'grey.400' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3, bgcolor: '#1e1e1e' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Email Input */}
            <Box>
              <TextField
                fullWidth
                label="User Email"
                value={assignEmail}
                onChange={(e) => setAssignEmail(e.target.value)}
                error={!!emailError}
                helperText={emailError}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'grey.100',
                    '& fieldset': {
                      borderColor: 'grey.600',
                    },
                    '&:hover fieldset': {
                      borderColor: 'grey.400',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'grey.400',
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: 'primary.main',
                  },
                }}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Box>

            {/* Subadmin Dropdown */}
            <Box>
              <FormControl fullWidth error={!!subadminError}>
                <InputLabel
                  sx={{
                    color: 'grey.400',
                    '&.Mui-focused': {
                      color: 'primary.main',
                    }
                  }}
                >
                  Select Subadmin
                </InputLabel>
                <Select
                  value={selectedSubadmin}
                  onChange={(e) => setSelectedSubadmin(e.target.value)}
                  label="Select Subadmin"
                  sx={{
                    color: 'grey.100',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'grey.600',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'grey.400',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                    },
                    '& .MuiSvgIcon-root': {
                      color: 'grey.400',
                    }
                  }}
                >
                  {filteredSubadmins.map((subadmin) => (
                    <MenuItem
                      key={subadmin._id}
                      value={subadmin._id}
                      sx={{ color: 'grey.900' }}
                    >
                      {subadmin.firstName} {subadmin.lastName} ({subadmin.email})
                    </MenuItem>
                  ))}
                </Select>
                {subadminError && (
                  <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                    {subadminError}
                  </Typography>
                )}
              </FormControl>
            </Box>

            {/* Info Text */}
            <Box sx={{ p: 2, bgcolor: 'grey.800', borderRadius: 2 }}>
              <Typography variant="body2" sx={{ color: 'grey.300' }}>
                <strong>Note:</strong> Enter the email of the user you want to assign to a subadmin.
                The user must already exist in the system and must not be assigned to any other subadmin.
              </Typography>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, bgcolor: 'grey.900', borderTop: '1px solid #333' }}>
          <Button
            onClick={closeAssignModal}
            sx={{
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
            onClick={handleAssignUser}
            disabled={isAssigning}
            startIcon={isAssigning ? null : <AssignmentIcon />}
            sx={{
              background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
              '&:hover': {
                background: 'linear-gradient(45deg, #1565c0, #1e88e5)'
              },
              '&:disabled': {
                background: 'grey.600'
              }
            }}
          >
            {isAssigning ? 'Assigning...' : 'Assign User'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default React.memo(AdminUsers);