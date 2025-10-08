import React, { useEffect, useState, useCallback } from "react";
import SideBar from "../layouts/AdminSidebar/Sidebar";
import AdminHeader from "./adminHeader";
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Button,
  Grid,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Checkbox,
  Paper,
  Tooltip,
  Avatar,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Badge,
  CardHeader,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  BugReport as BugIcon,
  ErrorOutline as ErrorIcon,
  Refresh as RefreshIcon,
  Launch as LaunchIcon,
  Visibility as ViewIcon,
  SelectAll as SelectAllIcon,
  Deselect as DeselectIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  Route as RouteIcon,
  Schedule as ScheduleIcon,
  Code as CodeIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  ContentCopy as CopyIcon,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import { useAuthUser } from "react-auth-kit";
import { Link, useNavigate } from "react-router-dom";
import {
  getErrorLogsApi,
  deleteErrorLogsApi,
} from "../../Api/Service";

const AdminErrorLogs = () => {
  const authUser = useAuthUser()();
  const Navigate = useNavigate();
  const [active, setActive] = useState(false);
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [detailDialog, setDetailDialog] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  const toggleBar = useCallback(() => setActive((p) => !p), []);

  const fetchLogs = useCallback(async (pageNum = 0, limit = rowsPerPage) => {
    setIsLoading(true);
    try {
      const res = await getErrorLogsApi(pageNum + 1, limit);
      if (res.success) {
        setLogs(res.logs);
        setPage(pageNum);
        setTotalCount(res.pagination?.total || res.logs.length);
        setRowsPerPage(limit);
      } else {
        toast.error(res.msg || "Failed to fetch logs");
      }
    } catch (err) {
      toast.error(err.message || "Error fetching logs");
    } finally {
      setIsLoading(false);
    }
  }, [rowsPerPage]);

  const handleDelete = useCallback(async (ids = []) => {
    try {
      const res = await deleteErrorLogsApi(ids);
      if (res.success) {
        toast.success(res.message || "Logs deleted successfully");
        setSelectedIds([]);
        setSelectAll(false);
        fetchLogs(page, rowsPerPage);
      } else {
        toast.error(res.msg || "Deletion failed");
      }
    } catch (err) {
      toast.error(err.message || "Error deleting logs");
    }
  }, [fetchLogs, page, rowsPerPage]);

  useEffect(() => {
    if (authUser.user.role !== "superadmin") {
      Navigate("/admin/dashboard");
      return;
    }
    fetchLogs(0, rowsPerPage);
  }, [authUser, Navigate, fetchLogs, rowsPerPage]);

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
    } else {
      setSelectedIds(logs.map(log => log._id));
    }
    setSelectAll(!selectAll);
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleChangePage = (event, newPage) => {
    fetchLogs(newPage, rowsPerPage);
  };

  const handleChangeRowsPerPage = (event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    fetchLogs(0, newRowsPerPage);
  };

  const getStatusColor = (statusCode) => {
    if (statusCode >= 500) return "error";
    if (statusCode >= 400) return "warning";
    return "info";
  };

  const getSeverityColor = (statusCode) => {
    if (statusCode >= 500) return "#f44336";
    if (statusCode >= 400) return "#ff9800";
    return "#2196f3";
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatRelativeTime = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const truncateText = (text, maxLength = 80) => {
    if (!text) return "No message";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const handleViewDetails = (log) => {
    setSelectedLog(log);
    setDetailDialog(true);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Copied to clipboard!");
    });
  };

  const ErrorDetailDialog = ({ log, open, onClose }) => {
    if (!log) return null;

    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: 'grey.900',
            borderRadius: 3,
            background: 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)'
          }
        }}
      >
        <DialogTitle sx={{
          color: 'white',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          <BugIcon sx={{ color: getSeverityColor(log.statusCode), fontSize: 32 }} />
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Error Details
            </Typography>
            <Typography variant="body2" color="grey.400">
              ID: {log._id}
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {/* Header Card */}
          <Card sx={{
            backgroundColor: 'rgba(255,255,255,0.05)',
            m: 3,
            mb: 2,
            border: `2px solid ${getSeverityColor(log.statusCode)}20`
          }}>
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <WarningIcon color="error" />
                    <Typography variant="h6" style={{ color: "white" }} color="white">
                      Error Message
                    </Typography>
                  </Box>
                  <Alert
                    severity={log.statusCode >= 500 ? "error" : log.statusCode >= 400 ? "warning" : "info"}
                    sx={{
                      backgroundColor: 'rgba(0,0,0,0.3)',
                      color: 'white',
                      alignItems: 'flex-start'
                    }}
                  >
                    {log.message}
                  </Alert>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <InfoIcon color="primary" />
                    <Typography variant="h6" style={{ color: "white" }} color="white">
                      Quick Info
                    </Typography>
                  </Box>
                  <Stack spacing={1}>
                    <Chip
                      label={`Status: ${log.statusCode || 'N/A'}`}
                      color={getStatusColor(log.statusCode)}
                      variant="outlined"
                    />
                    <Chip
                      label={`Method: ${log.method}`}
                      color="primary"
                      variant="outlined"
                    />
                    <Chip
                      label={formatRelativeTime(log.createdAt)}
                      color="secondary"
                      variant="outlined"
                    />
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

          {/* Detailed Information */}
          <Box sx={{ p: 3 }}>
            <Accordion defaultExpanded sx={{
              backgroundColor: 'rgba(255,255,255,0.02)',
              color: 'white',
              mb: 2
            }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <RouteIcon />
                  <Typography variant="h6" style={{ color: "white" }}>Route Information</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <CodeIcon sx={{ color: 'primary.main' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Endpoint"
                      secondary={log.route}
                      secondaryTypographyProps={{ color: 'grey.300' }}
                    />
                    <IconButton size="small" onClick={() => copyToClipboard(log.route)}>
                      <CopyIcon fontSize="small" />
                    </IconButton>
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <BugIcon sx={{ color: 'warning.main' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="HTTP Method"
                      secondary={log.method}
                      secondaryTypographyProps={{ color: 'grey.300' }}
                    />
                  </ListItem>
                  {log.ipAddress && (
                    <ListItem>
                      <ListItemIcon>
                        <InfoIcon sx={{ color: 'info.main' }} />
                      </ListItemIcon>
                      <ListItemText
                        primary="IP Address"
                        secondary={log.ipAddress}
                        secondaryTypographyProps={{ color: 'grey.300' }}
                      />
                    </ListItem>
                  )}
                </List>
              </AccordionDetails>
            </Accordion>

            <Accordion defaultExpanded sx={{
              backgroundColor: 'rgba(255,255,255,0.02)',
              color: 'white',
              mb: 2
            }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ScheduleIcon />
                  <Typography variant="h6" style={{ color: "white" }}>Timeline</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Occurred At"
                      secondary={formatDateTime(log.createdAt)}
                      secondaryTypographyProps={{ color: 'grey.300' }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Relative Time"
                      secondary={formatRelativeTime(log.createdAt)}
                      secondaryTypographyProps={{ color: 'grey.300' }}
                    />
                  </ListItem>
                </List>
              </AccordionDetails>
            </Accordion>

            {log.UserEmail && (
              <Accordion defaultExpanded sx={{
                backgroundColor: 'rgba(255,255,255,0.02)',
                color: 'white'
              }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon />
                    <Typography variant="h6" style={{ color: "white" }}>User Information</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <PersonIcon sx={{ color: 'success.main' }} />
                      </ListItemIcon>
                      <ListItemText
                        primary="User Name"
                        secondary={log.userName}
                        secondaryTypographyProps={{ color: 'grey.300' }}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <InfoIcon sx={{ color: 'info.main' }} />
                      </ListItemIcon>
                      <ListItemText
                        primary="Email"
                        secondary={log.UserEmail}
                        secondaryTypographyProps={{ color: 'grey.300' }}
                      />
                      <IconButton size="small" onClick={() => copyToClipboard(log.UserEmail)}>
                        <CopyIcon fontSize="small" />
                      </IconButton>
                    </ListItem>
                    {log.userId && (
                      <ListItem>
                        <ListItemIcon>
                          <LaunchIcon sx={{ color: 'primary.main' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary="User ID"
                          secondary={log.userId}
                          secondaryTypographyProps={{ color: 'grey.300' }}
                        />
                        <Button
                          size="small"
                          component={Link}
                          to={`/admin/user/${log.userId}/general`}
                          startIcon={<LaunchIcon />}
                          sx={{ color: 'primary.main' }}
                        >
                          View Profile
                        </Button>
                      </ListItem>
                    )}
                  </List>
                </AccordionDetails>
              </Accordion>
            )}

            {log.stackTrace && (
              <Accordion sx={{
                backgroundColor: 'rgba(255,255,255,0.02)',
                color: 'white',
                mt: 2
              }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CodeIcon />
                    <Typography variant="h6" style={{ color: "white" }}>Stack Trace</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Paper sx={{
                    p: 2,
                    backgroundColor: 'black',
                    color: 'grey.300',
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    maxHeight: 200,
                    overflow: 'auto'
                  }}>
                    <pre>{log.stackTrace}</pre>
                  </Paper>
                </AccordionDetails>
              </Accordion>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{
          p: 3,
          borderTop: '1px solid rgba(255,255,255,0.1)',
          gap: 1
        }}>
          <Button
            onClick={onClose}
            sx={{
              color: 'grey.300',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
            }}
          >
            Close
          </Button>
          <Button
            onClick={() => {
              setSelectedIds([log._id]);
              setDeleteDialog(true);
              onClose();
            }}
            color="error"
            variant="outlined"
            startIcon={<DeleteIcon />}
          >
            Delete This Log
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <div className="admin dark-new-ui">
      <div className="bg-gray-900 min-h-screen">
        <SideBar state={active} toggle={toggleBar} />
        <div className="bg-gray-900 relative min-h-screen w-full overflow-x-hidden px-4 transition-all duration-300 xl:px-10 lg:max-w-[calc(100%_-_280px)] lg:ms-[280px]">
          <AdminHeader toggle={toggleBar} pageName="Error Logs" />

          <Box sx={{ p: 3 }}>
            {/* Modern Header Section */}
            <Card sx={{
              mb: 3,
              background: 'linear-gradient(135deg, #25256cff 0%, #764ba2 100%)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                  <Box>
                    <Typography variant="h3" fontWeight={800} color="white" gutterBottom>
                      🚨 Error Monitoring
                    </Typography>
                    <Typography variant="h6" color="rgba(255,255,255,0.8)" sx={{ mb: 2 }}>
                      Real-time system error tracking and management
                    </Typography>
                    <Chip
                      label={`${totalCount} Total Errors (Last 7  days)`}
                      variant="filled"
                      sx={{
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        fontWeight: 600
                      }}
                    />
                  </Box>
                  <Avatar sx={{
                    width: 80,
                    height: 80,
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <BugIcon sx={{ fontSize: 40 }} />
                  </Avatar>
                </Box>

                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{
                      p: 2,
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      height: '100%',
                      minHeight: 100,
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                        <Box sx={{
                          p: 1.5,
                          borderRadius: 2,
                          backgroundColor: 'rgba(255,255,255,0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <ErrorIcon sx={{ color: 'white', fontSize: 28 }} />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h4" color="white" fontWeight={700}>
                            {totalCount}
                          </Typography>
                          <Typography variant="body2" color="rgba(255,255,255,0.8)">
                            Total Errors
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{
                      p: 2,
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      height: '100%',
                      minHeight: 100,
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                        <Box sx={{
                          p: 1.5,
                          borderRadius: 2,
                          backgroundColor: selectedIds.length > 0 ? 'rgba(244,67,54,0.3)' : 'rgba(255,255,255,0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <DeleteIcon sx={{ color: selectedIds.length > 0 ? '#ff6b6b' : 'white', fontSize: 28 }} />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography
                            variant="h4"
                            color={selectedIds.length > 0 ? "#ff6b6b" : "white"}
                            fontWeight={700}
                          >
                            {selectedIds.length}
                          </Typography>
                          <Typography variant="body2" color="rgba(255,255,255,0.8)">
                            Selected
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>

                  {/* New Card: Critical Errors (500+) */}
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{
                      p: 2,
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      height: '100%',
                      minHeight: 100,
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                        <Box sx={{
                          p: 1.5,
                          borderRadius: 2,
                          backgroundColor: 'rgba(244,67,54,0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <WarningIcon sx={{ color: '#ff6b6b', fontSize: 28 }} />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h4" color="#ff6b6b" fontWeight={700}>
                            {logs.filter(log => log.statusCode >= 500).length}
                          </Typography>
                          <Typography variant="body2" color="rgba(255,255,255,0.8)">
                            Critical
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>

                  {/* New Card: Recent (24h) */}
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{
                      p: 2,
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      height: '100%',
                      minHeight: 100,
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                        <Box sx={{
                          p: 1.5,
                          borderRadius: 2,
                          backgroundColor: 'rgba(33,150,243,0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <ScheduleIcon sx={{ color: '#64b5f6', fontSize: 28 }} />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h4" color="#64b5f6" fontWeight={700}>
                            {logs.filter(log => {
                              const logDate = new Date(log.createdAt);
                              const now = new Date();
                              const diffHours = (now - logDate) / (1000 * 60 * 60);
                              return diffHours <= 24;
                            }).length}
                          </Typography>
                          <Typography variant="body2" color="rgba(255,255,255,0.8)">
                            Last 24h
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Action Bar */}
            <Paper sx={{
              p: 2,
              mb: 2,
              backgroundColor: 'grey.800',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              flexWrap: 'wrap'
            }}>
              <Tooltip title="Refresh logs">
                <IconButton
                  onClick={() => fetchLogs(page, rowsPerPage)}
                  sx={{
                    backgroundColor: 'primary.main',
                    '&:hover': { backgroundColor: 'primary.dark' }
                  }}
                >
                  <RefreshIcon sx={{ color: 'white' }} />
                </IconButton>
              </Tooltip>

              <Badge badgeContent={selectedIds.length} color="error" showZero={false}>
                <Button
                  variant="contained"
                  color="error"
                  style={{padding:"5px",border:"1px solid crimson",color:"crimson"}}
                  startIcon={<DeleteIcon />}
                  onClick={() => setDeleteDialog(true)}
                  disabled={selectedIds.length === 0}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 3
                  }}
                >
                  Delete Selected
                </Button>
              </Badge>

              <Tooltip title={selectAll ? "Deselect all" : "Select all"}>
                <IconButton
                  onClick={handleSelectAll}
                  sx={{
                    backgroundColor: 'grey.700',
                    '&:hover': { backgroundColor: 'grey.600' }
                  }}
                >
                  {selectAll ? <DeselectIcon /> : <SelectAllIcon />}
                </IconButton>
              </Tooltip>

              <Box sx={{ flexGrow: 1 }} />

              <Typography variant="body2" color="grey.400">
                Showing {logs.length} of {totalCount} errors
              </Typography>
            </Paper>

            {isLoading && (
              <LinearProgress sx={{ mb: 2, height: 4, borderRadius: 2 }} />
            )}

            {/* Modern Table */}
            <TableContainer
              component={Paper}
              sx={{
                backgroundColor: 'grey.800',
                borderRadius: 3,
                border: '1px solid rgba(255,255,255,0.1)',
                overflow: 'hidden'
              }}
            >
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
                    <TableCell padding="checkbox" sx={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                      <Checkbox
                        indeterminate={selectedIds.length > 0 && selectedIds.length < logs.length}
                        checked={selectAll}
                        onChange={handleSelectAll}
                        sx={{ color: 'grey.400' }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: 'grey.300', fontWeight: 600, borderColor: 'rgba(255,255,255,0.1)' }}>
                      Error Details
                    </TableCell>
                    <TableCell sx={{ color: 'grey.300', fontWeight: 600, borderColor: 'rgba(255,255,255,0.1)' }}>
                      Route
                    </TableCell>
                    <TableCell sx={{ color: 'grey.300', fontWeight: 600, borderColor: 'rgba(255,255,255,0.1)' }}>
                      User
                    </TableCell>
                    <TableCell sx={{ color: 'grey.300', fontWeight: 600, borderColor: 'rgba(255,255,255,0.1)' }}>
                      Time
                    </TableCell>
                    <TableCell sx={{ color: 'grey.300', fontWeight: 600, borderColor: 'rgba(255,255,255,0.1)', textAlign: 'center' }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.length === 0 && !isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <ErrorIcon sx={{ fontSize: 64, color: 'grey.500', mb: 2 }} />
                          <Typography variant="h5" color="grey.400" gutterBottom>
                            No Error Logs Found
                          </Typography>
                          <Typography variant="body2" color="grey.500">
                            Your system is running smoothly with no errors detected
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => (
                      <TableRow
                        key={log._id}
                        hover
                        selected={selectedIds.includes(log._id)}
                        sx={{
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' },
                          transition: 'all 0.2s ease',
                          borderColor: 'rgba(255,255,255,0.1)'
                        }}
                      >
                        <TableCell padding="checkbox" sx={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                          <Checkbox
                            checked={selectedIds.includes(log._id)}
                            onChange={() => toggleSelect(log._id)}
                            sx={{ color: 'grey.400' }}
                          />
                        </TableCell>
                        <TableCell sx={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, maxWidth: 400 }}>
                            <Box sx={{
                              p: 1,
                              borderRadius: 1,
                              backgroundColor: `${getSeverityColor(log.statusCode)}20`,
                              display: 'flex',
                              alignItems: 'center'
                            }}>
                              <BugIcon sx={{ color: getSeverityColor(log.statusCode), fontSize: 20 }} />
                            </Box>
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <Tooltip title={log.message || "No error message"} arrow>
                                <Typography
                                  variant="body2"
                                  color="white"
                                  fontWeight={500}
                                  sx={{
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    lineHeight: 1.4,
                                    maxHeight: '2.8em',
                                    wordBreak: 'break-word'
                                  }}
                                >
                                  {truncateText(log.message, 70)}
                                </Typography>
                              </Tooltip>
                              {log.statusCode && (
                                <Chip
                                  label={`${log.statusCode}`}
                                  size="small"
                                  sx={{
                                    mt: 0.5,
                                    backgroundColor: getSeverityColor(log.statusCode),
                                    color: 'white',
                                    fontSize: '0.7rem',
                                    height: 20
                                  }}
                                />
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                          <Box>
                            <Chip
                              label={log.method}
                              size="small"
                              variant="outlined"
                              color="primary"
                              sx={{ mb: 0.5, fontSize: '0.7rem' }}
                            />
                            <Typography
                              variant="body2"
                              color="grey.300"
                              sx={{
                                display: '-webkit-box',
                                WebkitLineClamp: 1,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: 150,
                                fontFamily: 'monospace',
                                fontSize: '0.8rem'
                              }}
                            >
                              {log.route}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                          {log.UserEmail ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem' }}>
                                {log.userName?.charAt(0) || 'U'}
                              </Avatar>
                              <Box sx={{ minWidth: 0 }}>
                                <Typography variant="body2" color="white" noWrap>
                                  {log.userName}
                                </Typography>
                                <Typography variant="caption" color="grey.400" noWrap>
                                  {log.UserEmail}
                                </Typography>
                              </Box>
                            </Box>
                          ) : (
                            <Chip
                              label="System"
                              size="small"
                              variant="outlined"
                              color="default"
                            />
                          )}
                        </TableCell>
                        <TableCell sx={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                          <Box>
                            <Typography variant="body2" color="white" fontWeight={500}>
                              {formatRelativeTime(log.createdAt)}
                            </Typography>
                            <Typography variant="caption" color="grey.400">
                              {formatDateTime(log.createdAt)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ borderColor: 'rgba(255,255,255,0.1)', textAlign: 'center' }}>
                          <Stack direction="row" spacing={1} justifyContent="center">
                            <Tooltip title="View full details">
                              <IconButton
                                size="small"
                                onClick={() => handleViewDetails(log)}
                                sx={{
                                  backgroundColor: 'primary.main',
                                  '&:hover': { backgroundColor: 'primary.dark' }
                                }}
                              >
                                <ViewIcon sx={{ color: 'white', fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete this log">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => {
                                  setSelectedIds([log._id]);
                                  setDeleteDialog(true);
                                }}
                                sx={{
                                  backgroundColor: 'error.main',
                                  '&:hover': { backgroundColor: 'error.dark' }
                                }}
                              >
                                <DeleteIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Enhanced Pagination */}
            {logs.length > 0 && (
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={totalCount}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                sx={{
                  color: 'grey.300',
                  backgroundColor: 'grey.800',
                  borderBottomLeftRadius: 12,
                  borderBottomRightRadius: 12,
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderTop: 'none'
                }}
              />
            )}
          </Box>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog}
        onClose={() => setDeleteDialog(false)}
        PaperProps={{
          sx: {
            backgroundColor: 'grey.900',
            borderRadius: 3,
            background: 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)'
          }
        }}
      >
        <DialogTitle sx={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          🗑️ Confirm Deletion
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mt: 2, backgroundColor: 'rgba(255,152,0,0.1)' }}>
            This action cannot be undone. The selected error logs will be permanently deleted.
          </Alert>
          <Typography sx={{ color: 'grey.300', mt: 2 }}>
            {selectedIds.length === 1
              ? "Are you sure you want to delete this error log?"
              : `You're about to delete ${selectedIds.length} error logs.`
            }
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <Button
            onClick={() => setDeleteDialog(false)}
            sx={{
              color: 'grey.300',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              handleDelete(selectedIds);
              setDeleteDialog(false);
            }}
            color="error"
            variant="contained"
            startIcon={<DeleteIcon />}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 3
            }}
          >
            Delete {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Details Dialog */}
      <ErrorDetailDialog
        log={selectedLog}
        open={detailDialog}
        onClose={() => setDetailDialog(false)}
      />
    </div>
  );
};

export default React.memo(AdminErrorLogs);