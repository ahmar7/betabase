import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Button,
  CircularProgress,
  Chip,
  Pagination,
  Select,
  MenuItem,
  AppBar,
  Toolbar,
  IconButton,
  Checkbox,
  TextField,
} from "@mui/material";
import { DeleteForever, Restore, DeselectOutlined, Menu as MenuIcon } from "@mui/icons-material";
import { useAuthUser } from "react-auth-kit";
import { useNavigate } from "react-router-dom";
import {
  listDeletedLeadsApi,
  bulkRestoreLeadsApi,
  bulkHardDeleteLeadsApi,
  restoreLeadApi,
  hardDeleteLeadApi,
} from "../../../Api/Service";
import Sidebar from "./Sidebar.js";
import { toast } from "react-toastify";

const RecycleBin = () => {
  const authUser = useAuthUser();
  const navigate = useNavigate();
  const user = authUser?.();

  useEffect(() => {
    if (!user || user.user.role !== "superadmin") {
      navigate("/admin/dashboard/crm");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, limit: 50, totalFiltered: 0 });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenu, setisMobileMenu] = useState(false);
  const [filters, setFilters] = useState({ search: '', status: '', agent: '' });
  const [restoringId, setRestoringId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [bulkRestoring, setBulkRestoring] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarCollapsed(false);
      } else {
        setIsSidebarCollapsed(false);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchDeleted = async (page = 1, limit = pagination.limit) => {
    try {
      setLoading(true);
      const res = await listDeletedLeadsApi({ page, limit, ...filters });
      if (res.success) {
        setLeads(res.data.leads || []);
        setPagination(res.data.pagination || { currentPage: 1, totalPages: 1, limit, totalFiltered: 0 });
        setSelected(new Set());
      } else {
        setLeads([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeleted(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchDeleted(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const daysRemaining = (deletedAt, updatedAt) => {
    const src = deletedAt || updatedAt;
    if (!src) return "-";
    const d = new Date(src);
    if (Number.isNaN(d.getTime())) return "-";
    const del = d.getTime();
    const now = Date.now();
    const passedDays = Math.floor((now - del) / (1000 * 60 * 60 * 24));
    const remaining = Math.max(0, 30 - passedDays);
    return `${remaining}d`;
  };

  const formatDeletedAt = (deletedAt, updatedAt) => {
    const src = deletedAt || updatedAt;
    if (!src) return "-";
    const d = new Date(src);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleString();
  };

  const toggleOne = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const allSelected = useMemo(() => leads.length > 0 && selected.size === leads.length, [leads, selected]);
  const someSelected = useMemo(() => selected.size > 0 && selected.size < leads.length, [leads, selected]);

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(leads.map(l => l._id)));
  };

  const restoreSelected = async () => {
    if (selected.size === 0) return;
    try {
      setBulkRestoring(true);
      const res = await bulkRestoreLeadsApi(Array.from(selected));
      toast.success(res?.msg || 'Selected leads restored');
      fetchDeleted(pagination.currentPage);
    } catch (e) {
      toast.error('Failed to restore selected leads');
    } finally {
      setBulkRestoring(false);
    }
  };

  const deleteSelected = async () => {
    if (selected.size === 0) return;
    try {
      setBulkDeleting(true);
      const res = await bulkHardDeleteLeadsApi(Array.from(selected));
      toast.success(res?.msg || 'Selected leads permanently deleted');
      fetchDeleted(pagination.currentPage);
    } catch (e) {
      toast.error('Failed to delete selected leads');
    } finally {
      setBulkDeleting(false);
    }
  };

  const restoreOne = async (id) => {
    try {
      setRestoringId(id);
      const res = await restoreLeadApi(id);
      toast.success(res?.msg || 'Lead restored');
      fetchDeleted(pagination.currentPage);
    } catch (e) {
      toast.error('Failed to restore lead');
    } finally {
      setRestoringId(null);
    }
  };

  const deleteOne = async (id) => {
    try {
      setDeletingId(id);
      const res = await hardDeleteLeadApi(id);
      toast.success(res?.msg || 'Lead permanently deleted');
      fetchDeleted(pagination.currentPage);
    } catch (e) {
      toast.error('Failed to delete lead');
    } finally {
      setDeletingId(null);
    }
  };

  const handleLimit = (e) => {
    const limit = parseInt(e.target.value);
    setPagination(prev => ({ ...prev, limit }));
    fetchDeleted(1, limit);
  };

  return (
    <Box sx={{ display: "block", height: "100vh", bgcolor: "grey.50" }}>
      <Box>
        <Sidebar
          setisMobileMenu={setisMobileMenu}
          isMobileMenu={isMobileMenu}
          isCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
        />
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          ml: {
            xs: 0,
            md: isSidebarCollapsed ? "80px" : "280px",
          },
          transition: "margin-left 0.3s ease",
        }}
      >
        <AppBar position="static" elevation={0} sx={{ bgcolor: "background.paper", borderBottom: 1, borderColor: "divider" }}>
          <Toolbar sx={{ justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <IconButton
                onClick={() => setisMobileMenu(!isMobileMenu)}
                size="small"
                sx={{ color: 'text.secondary', display: { xs: 'block', md: 'none' } }}
              >
                <MenuIcon />
              </IconButton>
              <Box>
                <Typography variant="h5" fontWeight="bold" color="text.primary">Recycle Bin</Typography>
                <Typography variant="body2" color="text.secondary">Deleted leads are kept for 30 days</Typography>
              </Box>
            </Box>
          </Toolbar>
        </AppBar>

        <Box sx={{ flex: 1, overflow: "auto", p: 3 }}>

        <Card elevation={2} sx={{ mb: 3, borderRadius: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <Typography variant="h6" fontWeight="bold">Filters & Search</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                size="small"
                placeholder="Search..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
              <Select
                size="small"
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                displayEmpty
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="New">New</MenuItem>
                <MenuItem value="Call Back">Call Back</MenuItem>
                <MenuItem value="Not Active">Not Active</MenuItem>
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Not Interested">Not Interested</MenuItem>
              </Select>
            </Box>
          </CardContent>
        </Card>

      {selected.size > 0 && (
        <Card elevation={2} sx={{ mb: 2, borderRadius: 3, bgcolor: 'primary.light' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body1" fontWeight="bold">{selected.size} lead(s) selected</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="outlined" startIcon={<DeselectOutlined />} onClick={() => setSelected(new Set())}>Deselect All</Button>
                <Button variant="contained" startIcon={<Restore />} onClick={restoreSelected} disabled={bulkRestoring || loading}>
                  {bulkRestoring ? 'Restoring...' : 'Restore Selected'}
                </Button>
                <Button color="error" variant="contained" startIcon={<DeleteForever />} onClick={deleteSelected} disabled={bulkDeleting || loading}>
                  {bulkDeleting ? 'Deleting...' : 'Delete Selected'}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      <Card elevation={2}sx={{ borderRadius: 3 }}>
        <TableContainer>
          {loading ? (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={someSelected}
                      checked={leads.length > 0 && allSelected}
                      onChange={toggleAll}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Agent</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Deleted At</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Expires In</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {leads.map(l => (
                  <TableRow key={l._id} hover>
                    <TableCell padding="checkbox">
                      <Checkbox checked={selected.has(l._id)} onChange={() => toggleOne(l._id)} />
                    </TableCell>
                    <TableCell>{l.firstName} {l.lastName}</TableCell>
                    <TableCell>{l.email}</TableCell>
                    <TableCell>{l.agent ? `${l.agent.firstName} ${l.agent.lastName} (${l.agent.role})` : 'Unassigned'}</TableCell>
                    <TableCell>{formatDeletedAt(l.deletedAt, l.updatedAt)}</TableCell>
                    <TableCell>
                      <Chip size="small" label={daysRemaining(l.deletedAt, l.updatedAt)} color="warning" />
                    </TableCell>
                    <TableCell align="right">
                      <Button size="small" startIcon={<Restore />} onClick={() => restoreOne(l._id)} disabled={restoringId === l._id || loading}>
                        {restoringId === l._id ? 'Restoring...' : 'Restore'}
                      </Button>
                      <Button size="small" color="error" startIcon={<DeleteForever />} onClick={() => deleteOne(l._id)} disabled={deletingId === l._id || loading}>
                        {deletingId === l._id ? 'Deleting...' : 'Delete'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {leads.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="text.secondary">No deleted leads</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </TableContainer>
        {leads.length > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderTop: 1, borderColor: 'divider', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">Rows per page:</Typography>
              <Select size="small" value={pagination.limit} onChange={handleLimit} sx={{ minWidth: 80 }}>
                <MenuItem value={25}>25</MenuItem>
                <MenuItem value={50}>50</MenuItem>
                <MenuItem value={100}>100</MenuItem>
              </Select>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to {Math.min(pagination.currentPage * pagination.limit, pagination.totalFiltered)} of {pagination.totalFiltered} results
            </Typography>
            <Pagination count={pagination.totalPages} page={pagination.currentPage} onChange={(e, p) => fetchDeleted(p)} size="small" showFirstButton showLastButton />
          </Box>
        )}
      </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default RecycleBin;


