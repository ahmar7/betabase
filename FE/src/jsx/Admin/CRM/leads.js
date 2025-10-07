import React, { useEffect, useState } from "react";
import {
    Box,
    AppBar,
    Toolbar,
    Typography,
    TextField,
    Button,
    IconButton,
    Card,
    CardContent,
    Grid,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Menu,
    MenuItem,
    CircularProgress,
    InputAdornment,
    Select,
    FormControl,
    InputLabel,
    Pagination,
    Stack,
    Badge,
    Avatar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Stepper,
    Step,
    StepLabel,
    StepContent,
    Tabs,
    Tab,
    FormControlLabel,
    Checkbox,
    FormGroup,
    Alert,
    Checkbox as MuiCheckbox,
    Collapse,
    List,
    ListItem,
    ListItemText,
    Divider,
} from "@mui/material";
import {
    Add,
    Search,
    FilterList,
    Download,
    MoreVert,
    Visibility,
    Edit,
    Delete,
    Email,
    Phone,
    Mail,
    BarChart,
    Schedule,
    AttachMoney,
    People,
    CloudUpload,
    Description,
    Close,
    SwapHoriz,
    LocationOn,
    NavigateBefore,
    NavigateNext,
    KeyboardArrowDown,
    KeyboardArrowUp,
    DeleteSweep,
    SelectAll,
    DeselectOutlined,
    Menu as MenuIcon
} from "@mui/icons-material";
import {
    adminCrmLeadsApi,
    createLeadApi,
    uploadLeadsCsvApi,
    deleteLeadApi,
    deleteLeadsBulkApi,
    deleteAllLeadsApi,
    updateLeadApi, exportLeadsApi,
    allUsersApi,
    assignLeadsApi
} from "../../../Api/Service";
import { toast } from "react-toastify";
import Sidebar from "./Sidebar.js";
import { useNavigate } from "react-router-dom";
import { useAuthUser } from "react-auth-kit";
import { useCallback } from "react";

// ... (Field mapping configuration and CreateLeadDialog component remain the same)
// Field mapping configuration based on updated schema
const AVAILABLE_FIELDS = [
    { key: 'firstName', label: 'First Name', required: true, description: 'Lead first name' },
    { key: 'lastName', label: 'Last Name', required: true, description: 'Lead last name' },
    { key: 'email', label: 'Email', required: true, description: 'Email address' },
    { key: 'phone', label: 'Phone', required: false, description: 'Phone number' },
    { key: 'country', label: 'Country', required: false, description: 'Country name' },
    { key: 'Brand', label: 'Brand', required: false, description: 'Company brand' },
    { key: 'Address', label: 'Address', required: false, description: 'Physical address' },
    { key: 'status', label: 'Status', required: false, description: 'Lead status (New, Call Back, etc.)' },
];

const STATUS_OPTIONS = ["New", "Call Back", "Not Active", "Active", "Not Interested"];

// Enhanced Create Lead Dialog Component
const CreateLeadDialog = ({ open, onClose, onLeadCreated, agents, currentUser }) => {

    const [activeStep, setActiveStep] = useState(0);
    const [tabValue, setTabValue] = useState(0);
    const [manualForm, setManualForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        country: "",
        Brand: "",
        Address: "",
        status: "New",
    });
    const [csvFile, setCsvFile] = useState(null);
    const [csvHeaders, setCsvHeaders] = useState([]);
    const [csvPreview, setCsvPreview] = useState([]);
    const [fieldMapping, setFieldMapping] = useState({});
    const [selectedFields, setSelectedFields] = useState({});
    const [uploading, setUploading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [mappingComplete, setMappingComplete] = useState(false);
    const [selectedAgentId, setSelectedAgentId] = useState("");

    useEffect(() => {
        // Default assigned agent to the creator when dialog opens
        if (open && currentUser?.user?._id) {
            setSelectedAgentId(currentUser.user._id);
        }
    }, [open, currentUser]);

    const steps = ['Choose Method', 'Upload & Map Fields', 'Review & Submit'];

    // Prevent CSV tab for subadmins
    useEffect(() => {
        if (currentUser?.user?.role === 'subadmin' && tabValue === 1) {
            setTabValue(0);
        }
    }, [currentUser, tabValue]);

    // Initialize selected fields
    useEffect(() => {
        const initialSelectedFields = {};
        AVAILABLE_FIELDS.forEach(field => {
            initialSelectedFields[field.key] = field.required;
        });
        setSelectedFields(initialSelectedFields);
    }, []);

    const handleManualFormChange = (field, value) => {
        setManualForm(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
            setCsvFile(file);
            parseCsvHeaders(file);
        } else {
            toast.error('Please select a valid CSV file');
        }
    };

    const parseCsvHeaders = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const csvText = e.target.result;
            const lines = csvText.split('\n');
            const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, ''));

            setCsvHeaders(headers);

            // Create preview of first 3 rows
            const previewRows = lines.slice(1, 4).map(line => {
                const values = line.split(',').map(value => value.trim().replace(/"/g, ''));
                const row = {};
                headers.forEach((header, index) => {
                    row[header] = values[index] || '';
                });
                return row;
            }).filter(row => Object.values(row).some(val => val !== ''));

            setCsvPreview(previewRows);

            // Auto-map fields based on header names
            const autoMapping = {};
            headers.forEach(header => {
                const matchedField = AVAILABLE_FIELDS.find(field =>
                    header.toLowerCase().includes(field.key.toLowerCase()) ||
                    field.key.toLowerCase().includes(header.toLowerCase()) ||
                    header.toLowerCase().includes(field.label.toLowerCase())
                );
                if (matchedField) {
                    autoMapping[matchedField.key] = header;
                }
            });
            setFieldMapping(autoMapping);
        };
        reader.readAsText(file);
    };

    const handleFieldMappingChange = (fieldKey, csvHeader) => {
        setFieldMapping(prev => ({
            ...prev,
            [fieldKey]: csvHeader
        }));
    };

    const handleFieldSelectionChange = (fieldKey, isSelected) => {
        setSelectedFields(prev => ({
            ...prev,
            [fieldKey]: isSelected
        }));

        // If deselecting a field, remove from mapping
        if (!isSelected) {
            setFieldMapping(prev => {
                const newMapping = { ...prev };
                delete newMapping[fieldKey];
                return newMapping;
            });
        }
    };

    const validateFieldMapping = () => {
        // Check if all required fields are mapped
        const requiredFields = AVAILABLE_FIELDS.filter(field => field.required);
        const missingRequired = requiredFields.some(field =>
            selectedFields[field.key] && !fieldMapping[field.key]
        );

        if (missingRequired) {
            toast.error('Please map all required fields');
            return false;
        }

        // Check if at least one field is selected
        const hasSelectedFields = Object.values(selectedFields).some(selected => selected);
        if (!hasSelectedFields) {
            toast.error('Please select at least one field to import');
            return false;
        }

        return true;
    };

    const handleManualSubmit = async () => {
        try {
            setCreating(true);
            const payload = { ...manualForm };
            if (currentUser?.user?.role === 'superadmin' && selectedAgentId) {
                payload.agentId = selectedAgentId;
            }
            const response = await createLeadApi(payload);
            if (response.success) {
                toast.success('Lead created successfully!');
                onLeadCreated();
                onClose();
                resetForm();
            } else {
                toast.error(response.msg || 'Failed to create lead');
            }
        } catch (error) {
            toast.error('Error creating lead');
            console.error('Create lead error:', error);
        } finally {
            setCreating(false);
        }
    };

    const handleCsvUpload = async () => {
        if (!csvFile) {
            toast.error('Please select a CSV file');
            return;
        }

        if (!validateFieldMapping()) {
            return;
        }

        try {
            setUploading(true);
            const formData = new FormData();
            formData.append('file', csvFile);
            formData.append('fieldMapping', JSON.stringify(fieldMapping));
            formData.append('selectedFields', JSON.stringify(selectedFields));
            if (currentUser?.user?.role === 'superadmin' && selectedAgentId) {
                formData.append('agentId', selectedAgentId);
            }

            const response = await uploadLeadsCsvApi(formData);
            if (response.success) {
                toast.success(`Successfully processed ${response.data.processed} leads! ${response.data.skipped > 0 ? `${response.data.skipped} leads skipped.` : ''}`);
                onLeadCreated();
                onClose();
                resetForm();
            } else {
                toast.error(response.msg || 'Failed to upload leads');
            }
        } catch (error) {
            toast.error('Error uploading leads');
            console.error('Upload leads error:', error);
        } finally {
            setUploading(false);
        }
    };

    const resetForm = () => {
        setManualForm({
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            country: "",
            Brand: "",
            Address: "",
            status: "New",
        });
        setCsvFile(null);
        setCsvHeaders([]);
        setCsvPreview([]);
        setFieldMapping({});
        setMappingComplete(false);
        setActiveStep(0);
        setTabValue(0);
        setSelectedAgentId("");

        // Reset selected fields to defaults
        const initialSelectedFields = {};
        AVAILABLE_FIELDS.forEach(field => {
            initialSelectedFields[field.key] = field.required;
        });
        setSelectedFields(initialSelectedFields);
    };

    const handleNext = () => {
        if (activeStep === 1 && tabValue === 1) {
            if (!validateFieldMapping()) {
                return;
            }
            setMappingComplete(true);
        }
        setActiveStep((prev) => prev + 1);
    };

    const handleBack = () => {
        setActiveStep((prev) => prev - 1);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">Create New Lead</Typography>
                    <IconButton onClick={handleClose}>
                        <Close />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent>
                <Stepper activeStep={activeStep} orientation="vertical">
                    {/* Step 1: Choose Method */}
                    <Step>
                        <StepLabel>Choose Creation Method</StepLabel>
                        <StepContent>
                            <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 2 }}>
                                <Tab label="Manual Entry" />
                                {currentUser?.user?.role !== 'subadmin' && (
                                    <Tab label="CSV Upload" />
                                )}
                            </Tabs>

                            {tabValue === 0 && (
                                <Box>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        Add a single lead manually by filling out the form
                                    </Typography>
                                    <Button variant="contained" onClick={handleNext}>
                                        Continue with Manual Entry
                                    </Button>
                                </Box>
                            )}

                            {tabValue === 1 && currentUser?.user?.role !== 'subadmin' && (
                                <Box>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        Upload a CSV file to create multiple leads at once
                                    </Typography>
                                    <Button
                                        variant="outlined"
                                        component="label"
                                        startIcon={<CloudUpload />}
                                        sx={{ mb: 2 }}
                                    >
                                        Select CSV File
                                        <input
                                            type="file"
                                            hidden
                                            accept=".csv"
                                            onChange={handleFileUpload}
                                        />
                                    </Button>
                                    {csvFile && (
                                        <Typography variant="body2" sx={{ mb: 2 }}>
                                            Selected: {csvFile.name} ({csvHeaders.length} columns detected)
                                        </Typography>
                                    )}
                                    <Box>
                                        <Button
                                            variant="contained"
                                            onClick={handleNext}
                                            disabled={!csvFile}
                                        >
                                            Continue with CSV Upload
                                        </Button>
                                    </Box>
                                </Box>
                            )}
                        </StepContent>
                    </Step>

                    {/* Step 2: Enter Details / Map Fields */}
                    <Step>
                        <StepLabel>
                            {tabValue === 0 ? 'Enter Lead Details' : 'Map CSV Fields'}
                        </StepLabel>
                        <StepContent>
                            {tabValue === 0 ? (
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="First Name"
                                            value={manualForm.firstName}
                                            onChange={(e) => handleManualFormChange('firstName', e.target.value)}
                                            required
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Last Name"
                                            value={manualForm.lastName}
                                            onChange={(e) => handleManualFormChange('lastName', e.target.value)}
                                            required
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Email"
                                            type="email"
                                            value={manualForm.email}
                                            onChange={(e) => handleManualFormChange('email', e.target.value)}
                                            required
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Phone"
                                            value={manualForm.phone}
                                            onChange={(e) => handleManualFormChange('phone', e.target.value)}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Country"
                                            value={manualForm.country}
                                            onChange={(e) => handleManualFormChange('country', e.target.value)}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Brand"
                                            value={manualForm.Brand}
                                            onChange={(e) => handleManualFormChange('Brand', e.target.value)}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Address"
                                            value={manualForm.Address}
                                            onChange={(e) => handleManualFormChange('Address', e.target.value)}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <LocationOn />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <FormControl fullWidth>
                                            <InputLabel>Status</InputLabel>
                                            <Select
                                                value={manualForm.status}
                                                label="Status"
                                                onChange={(e) => handleManualFormChange('status', e.target.value)}
                                            >
                                                {STATUS_OPTIONS.map((status) => (
                                                    <MenuItem key={status} value={status}>
                                                        {status}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                </Grid>
                            ) : (
                                <Box>
                                    <Alert severity="info" sx={{ mb: 2 }}>
                                        Map your CSV columns to the lead fields. Required fields are marked with *
                                    </Alert>

                                    {/* CSV Preview */}
                                    {csvPreview.length > 0 && (
                                        <Box sx={{ mb: 3 }}>
                                            <Typography variant="subtitle2" gutterBottom>
                                                CSV Preview (first 3 rows):
                                            </Typography>
                                            <TableContainer component={Paper} variant="outlined">
                                                <Table size="small">
                                                    <TableHead>
                                                        <TableRow>
                                                            {csvHeaders.map(header => (
                                                                <TableCell key={header} sx={{ fontWeight: 'bold' }}>
                                                                    {header}
                                                                </TableCell>
                                                            ))}
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {csvPreview.map((row, index) => (
                                                            <TableRow key={index}>
                                                                {csvHeaders.map(header => (
                                                                    <TableCell key={header}>
                                                                        {row[header] || '-'}
                                                                    </TableCell>
                                                                ))}
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        </Box>
                                    )}

                                    {/* Field Mapping Interface */}
                                    <Typography variant="subtitle2" gutterBottom>
                                        Field Mapping:
                                    </Typography>
                                    <Grid container spacing={2}>
                                        {AVAILABLE_FIELDS.map(field => (
                                            <Grid item xs={12} key={field.key}>
                                                <Card variant="outlined">
                                                    <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                                                        <Box display="flex" alignItems="center" justifyContent="space-between">
                                                            <Box display="flex" alignItems="center" gap={2} flex={1}>
                                                                <FormControlLabel
                                                                    control={
                                                                        <Checkbox
                                                                            checked={selectedFields[field.key] || false}
                                                                            onChange={(e) => handleFieldSelectionChange(field.key, e.target.checked)}
                                                                            disabled={field.required}
                                                                        />
                                                                    }
                                                                    label={
                                                                        <Box>
                                                                            <Typography variant="body2" fontWeight="medium">
                                                                                {field.label} {field.required && '*'}
                                                                            </Typography>
                                                                            <Typography variant="caption" color="text.secondary">
                                                                                {field.description}
                                                                            </Typography>
                                                                        </Box>
                                                                    }
                                                                />
                                                            </Box>

                                                            {selectedFields[field.key] && (
                                                                <Box display="flex" alignItems="center" gap={1} flex={1}>
                                                                    <SwapHoriz fontSize="small" color="action" />
                                                                    <FormControl size="small" fullWidth>
                                                                        <InputLabel>Map to CSV column</InputLabel>
                                                                        <Select
                                                                            value={fieldMapping[field.key] || ''}
                                                                            label="Map to CSV column"
                                                                            onChange={(e) => handleFieldMappingChange(field.key, e.target.value)}
                                                                        >
                                                                            <MenuItem value="">
                                                                                <em>Select column...</em>
                                                                            </MenuItem>
                                                                            {csvHeaders.map(header => (
                                                                                <MenuItem key={header} value={header}>
                                                                                    {header}
                                                                                </MenuItem>
                                                                            ))}
                                                                        </Select>
                                                                    </FormControl>
                                                                </Box>
                                                            )}
                                                        </Box>
                                                    </CardContent>
                                                </Card>
                                            </Grid>
                                        ))}
                                    </Grid>

                                    {/* Mapping Summary */}
                                    <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                                        <Typography variant="caption" display="block" gutterBottom>
                                            <strong>Mapping Summary:</strong>
                                        </Typography>
                                        <Typography variant="caption" display="block">
                                            Selected: {Object.values(selectedFields).filter(Boolean).length} fields |
                                            Mapped: {Object.values(fieldMapping).filter(Boolean).length} fields
                                        </Typography>
                                    </Box>
                                </Box>
                            )}
                            <Box sx={{ mt: 2 }}>
                                <Button onClick={handleBack} sx={{ mr: 1 }}>
                                    Back
                                </Button>
                                <Button
                                    variant="contained"
                                    onClick={handleNext}
                                    disabled={
                                        tabValue === 0 && (!manualForm.firstName || !manualForm.lastName || !manualForm.email)
                                    }
                                >
                                    Next
                                </Button>
                            </Box>
                        </StepContent>
                    </Step>

                    {/* Step 3: Review & Submit */}
                    <Step>
                        <StepLabel>Review & Submit</StepLabel>
                        <StepContent>
                            {tabValue === 0 ? (
                                <Box>
                                    <Typography variant="h6" gutterBottom>Review Lead Information</Typography>
                                    <Grid container spacing={1}>
                                        <Grid item xs={6}><strong>First Name:</strong></Grid>
                                        <Grid item xs={6}>{manualForm.firstName}</Grid>
                                        <Grid item xs={6}><strong>Last Name:</strong></Grid>
                                        <Grid item xs={6}>{manualForm.lastName}</Grid>
                                        <Grid item xs={6}><strong>Email:</strong></Grid>
                                        <Grid item xs={6}>{manualForm.email}</Grid>
                                        <Grid item xs={6}><strong>Phone:</strong></Grid>
                                        <Grid item xs={6}>{manualForm.phone}</Grid>
                                        <Grid item xs={6}><strong>Country:</strong></Grid>
                                        <Grid item xs={6}>{manualForm.country}</Grid>
                                        <Grid item xs={6}><strong>Brand:</strong></Grid>
                                        <Grid item xs={6}>{manualForm.Brand}</Grid>
                                        <Grid item xs={6}><strong>Address:</strong></Grid>
                                        <Grid item xs={6}>{manualForm.Address}</Grid>
                                        <Grid item xs={6}><strong>Status:</strong></Grid>
                                        <Grid item xs={6}>{manualForm.status}</Grid>
                                    </Grid>
                                </Box>
                            ) : (
                                <Box>
                                    <Typography variant="h6" gutterBottom>Ready to Upload</Typography>
                                    <Typography variant="body2" gutterBottom>
                                        You are about to upload <strong>{csvFile?.name}</strong> with the following mapping:
                                    </Typography>

                                    <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                                        {AVAILABLE_FIELDS.filter(field => selectedFields[field.key] && fieldMapping[field.key]).map(field => (
                                            <Typography key={field.key} variant="body2" sx={{ mb: 1 }}>
                                                <strong>{field.label}:</strong> {fieldMapping[field.key]}
                                            </Typography>
                                        ))}
                                    </Box>

                                    <Alert severity="warning" sx={{ mt: 2 }}>
                                        This will import {csvPreview.length > 0 ? 'multiple' : 'all'} leads from the CSV file. Duplicate emails will be skipped automatically.
                                    </Alert>
                                </Box>
                            )}
                            <Box sx={{ mt: 2 }}>
                                <Button onClick={handleBack} sx={{ mr: 1 }}>
                                    Back
                                </Button>
                                <Button
                                    variant="contained"
                                    onClick={tabValue === 0 ? handleManualSubmit : handleCsvUpload}
                                    disabled={creating || uploading}
                                >
                                    {creating || uploading ? <CircularProgress size={24} /> : 'Submit'}
                                </Button>
                            </Box>
                        </StepContent>
                    </Step>
                </Stepper>
                {currentUser?.user?.role === 'superadmin' && (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>Assign to Agent</Typography>
                        <FormControl fullWidth size="small">
                            <InputLabel>Agent</InputLabel>
                            <Select
                                value={selectedAgentId}
                                label="Agent"
                                onChange={(e) => setSelectedAgentId(e.target.value)}
                            >
                                <MenuItem value="">
                                    <em>Unassigned</em>
                                </MenuItem>
                                {agents
                                    .filter(a => a.role === 'admin' || a.role === 'subadmin' || a.role === 'superadmin')
                                    .map(agent => (
                                        <MenuItem key={agent._id} value={agent._id}>
                                            {agent.firstName} {agent.lastName} ({agent.role}){currentUser?.user?._id === agent._id ? ' (self)' : ''}
                                        </MenuItem>
                                    ))}
                            </Select>
                        </FormControl>
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
};
// View Details Component
const LeadDetails = ({ lead, open, onClose }) => {
    if (!lead) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">Lead Details</Typography>
                    <IconButton onClick={onClose}>
                        <Close />
                    </IconButton>
                </Box>
            </DialogTitle>
            <DialogContent>
                <Grid container spacing={3} sx={{ mt: 1 }}>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">First Name</Typography>
                        <Typography variant="body1">{lead.firstName}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">Last Name</Typography>
                        <Typography variant="body1">{lead.lastName}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                        <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Email fontSize="small" />
                            {lead.email}
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
                        <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Phone fontSize="small" />
                            {lead.phone || 'Not provided'}
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">Country</Typography>
                        <Typography variant="body1">{lead.country || 'Not provided'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">Brand</Typography>
                        <Typography variant="body1">{lead.Brand || 'Not provided'}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">Address</Typography>
                        <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LocationOn fontSize="small" />
                            {lead.Address || 'Not provided'}
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                        <Chip
                            label={lead.status}
                            color={
                                lead.status === 'Active' ? 'success' :
                                    lead.status === 'Call Back' ? 'warning' :
                                        lead.status === 'Not Active' ? 'error' : 'primary'
                            }
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">Created Date</Typography>
                        <Typography variant="body1">
                            {new Date(lead.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </Typography>
                    </Grid>
                    {lead.notes && lead.notes.length > 0 && (
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Notes
                            </Typography>
                            <List dense>
                                {lead.notes.map((note, index) => (
                                    <ListItem key={index}>
                                        <ListItemText
                                            primary={note.text}
                                            secondary={`By ${note.author?.firstName || 'Unknown'} on ${new Date(note.createdAt).toLocaleDateString()}`}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </Grid>
                    )}
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};

// Edit Lead Component
const EditLeadDialog = ({ lead, open, onClose, onLeadUpdated }) => {

    const [editForm, setEditForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        country: "",
        Brand: "",
        Address: "",
        status: "New",
    });
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        if (lead) {
            setEditForm({
                firstName: lead.firstName || "",
                lastName: lead.lastName || "",
                email: lead.email || "",
                phone: lead.phone || "",
                country: lead.country || "",
                Brand: lead.Brand || "",
                Address: lead.Address || "",
                status: lead.status || "New",
            });
        }
    }, [lead]);

    const handleEditFormChange = (field, value) => {
        setEditForm(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleUpdateLead = async () => {
        try {
            setUpdating(true);
            const response = await updateLeadApi(lead._id, editForm);
            if (response.success) {
                toast.success('Lead updated successfully!');
                onLeadUpdated();
                onClose();
            } else {
                toast.error(response.msg || 'Failed to update lead');
            }
        } catch (error) {
            toast.error('Error updating lead');
            console.error('Update lead error:', error);
        } finally {
            setUpdating(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">Edit Lead</Typography>
                    <IconButton onClick={onClose}>
                        <Close />
                    </IconButton>
                </Box>
            </DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="First Name"
                            value={editForm.firstName}
                            onChange={(e) => handleEditFormChange('firstName', e.target.value)}
                            required
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Last Name"
                            value={editForm.lastName}
                            onChange={(e) => handleEditFormChange('lastName', e.target.value)}
                            required
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Email"
                            type="email"
                            value={editForm.email}
                            onChange={(e) => handleEditFormChange('email', e.target.value)}
                            required
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Phone"
                            value={editForm.phone}
                            onChange={(e) => handleEditFormChange('phone', e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Country"
                            value={editForm.country}
                            onChange={(e) => handleEditFormChange('country', e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Brand"
                            value={editForm.Brand}
                            onChange={(e) => handleEditFormChange('Brand', e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Address"
                            value={editForm.Address}
                            onChange={(e) => handleEditFormChange('Address', e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LocationOn />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={editForm.status}
                                label="Status"
                                onChange={(e) => handleEditFormChange('status', e.target.value)}
                            >
                                {STATUS_OPTIONS.map((status) => (
                                    <MenuItem key={status} value={status}>
                                        {status}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    variant="contained"
                    onClick={handleUpdateLead}
                    disabled={updating || !editForm.firstName || !editForm.lastName || !editForm.email}
                >
                    {updating ? <CircularProgress size={24} /> : 'Update Lead'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

const LeadsPage = () => {

    let authUser = useAuthUser();
    let navigate = useNavigate();
    useEffect(() => {
        if (authUser().user.role === "user") {
            navigate("/dashboard");
            return;
        }

    }, []);
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        search: "",
        status: "",
        country: "",
        agent: "",
    });
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalLeads: 0,
        totalFiltered: 0,
        limit: 100,
        hasNextPage: false,
        hasPrevPage: false,
    });
    const [countries, setCountries] = useState([
        "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda",
        "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas",
        "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize",
        "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil",
        "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia",
        "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China",
        "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus",
        "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic",
        "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia",
        "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia",
        "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea",
        "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland",
        "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy",
        "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Korea, North",
        "Korea, South", "Kosovo", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon",
        "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
        "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta",
        "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia",
        "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique",
        "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand",
        "Nicaragua", "Niger", "Nigeria", "North Macedonia", "Norway", "Oman",
        "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay",
        "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia",
        "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines",
        "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal",
        "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia",
        "Solomon Islands", "Somalia", "South Africa", "South Sudan", "Spain",
        "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria",
        "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo",
        "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan",
        "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom",
        "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City",
        "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
    ]);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
    const [isMobileMenu, setisMobileMenu] = useState(true)
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setIsSidebarCollapsed(false); // collapse on mobile
            }  
        };

        // Run once on mount
        handleResize();

        // Add event listener for screen resize
        window.addEventListener("resize", handleResize);

        // Cleanup listener
        return () => window.removeEventListener("resize", handleResize);
    }, []);
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedLead, setSelectedLead] = useState(null);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedLeads, setSelectedLeads] = useState(new Set());
    const [expandedLead, setExpandedLead] = useState(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteType, setDeleteType] = useState(''); // 'single', 'bulk', 'all'
    const [deleting, setDeleting] = useState(false);
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [assigning, setAssigning] = useState(false);
    const [selectedAgentId, setSelectedAgentId] = useState("");

    // Toggle sidebar
    const currentAuthUser = authUser();
    const getAllUsers = async () => {
        try {
            const allUsers = await allUsersApi();

            if (!allUsers.success) {
                toast.error(allUsers.msg);
                return;
            }

            const currentUser = authUser().user;
            console.log('updatedCurrentUser.role: ', currentUser._id, allUsers);

            // Filter current user from latest data to get updated permissions
            const updatedCurrentUser = allUsers.allUsers.find(user => user._id === currentUser._id);

            if (!updatedCurrentUser) {
                toast.error("User not found");
                return;
            }

            // Check CRM access permissions and redirect if false
            if (updatedCurrentUser.role === "admin") {
                if (!updatedCurrentUser.adminPermissions?.accessCrm) {
                    // Redirect admin to dashboard if no CRM access
                    navigate("/admin/dashboard");
                    return;
                }
            } else if (updatedCurrentUser.role === "subadmin") {
                if (!updatedCurrentUser.permissions?.accessCrm) {
                    // Redirect subadmin to dashboard if no CRM access
                    navigate("/admin/dashboard");
                    return;
                }
            }

            let agents = []; // Initialize agents array

            // Set agents based on user role
            if (updatedCurrentUser.role === "superadmin") {
                // For admin/superadmin: get all admin, superadmin, and subadmin users
                agents = allUsers.allUsers.filter(user =>
                    user.role.includes("admin") ||
                    user.role.includes("superadmin") ||
                    user.role.includes("subadmin")
                );

            }
            else {
                agents = []
            }

            setAgents(agents); // Set the agents state

        } catch (error) {
            toast.error(error.message || "Error fetching users");
        }
    }; // Add navigate to dependencies
    useEffect(() => {

        getAllUsers()
    }, []);
    const [agents, setAgents] = useState([]);

    // Fetch leads with filters and pagination
    const fetchLeads = async (page = 1, limit = pagination.limit) => {
        try {
            setLoading(true);
            const params = {
                ...filters,
                page,
                limit
            };

            const res = await adminCrmLeadsApi({ params });

            if (res.success) {
                setLeads(res.data.leads || []);
                setPagination(res.data.pagination || {
                    currentPage: 1,
                    totalPages: 1,
                    totalLeads: 0,
                    totalFiltered: 0,
                    limit: limit,
                    hasNextPage: false,
                    hasPrevPage: false,
                });
                setSelectedLeads(new Set()); // Clear selection on new fetch
            } else {
                toast.error(res.msg || 'Failed to fetch leads');
                setLeads([]);
                setPagination(prev => ({ ...prev, currentPage: 1, totalPages: 1 }));
            }
        } catch (err) {
            console.error("Error fetching leads:", err);
            toast.error('Error fetching leads');
            setLeads([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchDropdownData = async () => {
        try {
            setCountries([]);
            setAgents([]);
        } catch (err) {
            console.error("Error fetching dropdown data:", err);
        }
    };

    useEffect(() => {
        fetchLeads(1); // Reset to page 1 when filters change
    }, [filters]);

    const handleLeadCreated = () => {
        fetchLeads(pagination.currentPage);
    };

    const handleLeadUpdated = () => {
        fetchLeads(pagination.currentPage);
    };

    // Selection handlers
    const handleSelectAll = () => {
        if (selectedLeads.size === leads.length) {
            setSelectedLeads(new Set());
        } else {
            setSelectedLeads(new Set(leads.map(lead => lead._id)));
        }
    };

    const handleSelectLead = (leadId) => {
        const newSelected = new Set(selectedLeads);
        if (newSelected.has(leadId)) {
            newSelected.delete(leadId);
        } else {
            newSelected.add(leadId);
        }
        setSelectedLeads(newSelected);
    };

    // Delete handlers
    const handleDeleteClick = (type, lead = null) => {
        setDeleteType(type);
        setSelectedLead(lead);
        setDeleteConfirmOpen(true);
    };

    const handleDeleteConfirm = async () => {
        try {
            setDeleting(true);
            let response;

            switch (deleteType) {
                case 'single':
                    response = await deleteLeadApi(selectedLead._id);
                    break;
                case 'bulk':
                    response = await deleteLeadsBulkApi(Array.from(selectedLeads));
                    break;
                case 'all':
                    response = await deleteAllLeadsApi();
                    break;
                default:
                    return;
            }

            if (response.success) {
                toast.success(response.msg || 'Leads deleted successfully');
                fetchLeads(pagination.currentPage);
            } else {
                toast.error(response.msg || 'Failed to delete leads');
            }
        } catch (error) {
            toast.error('Error deleting leads');
            console.error('Delete leads error:', error);
        } finally {
            setDeleting(false);
            setDeleteConfirmOpen(false);
            setSelectedLead(null);
            setDeleteType('');
        }
    };

    // Menu handlers
    const handleMenuOpen = (event, lead) => {
        setAnchorEl(event.currentTarget);
        setSelectedLead(lead);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedLead(null);
    };

    const handleViewDetails = () => {
        setViewDetailsOpen(true);
        setAnchorEl(null);
    };

    const handleEditLead = () => {
        setEditDialogOpen(true);
        setAnchorEl(null);
    };

    const handleDeleteLead = () => {
        handleDeleteClick('single', selectedLead);
        setAnchorEl(null);
    };

    // Pagination handlers (remain the same)
    const handlePageChange = (event, newPage) => {
        fetchLeads(newPage);
    };

    const handleLimitChange = (event) => {
        const newLimit = parseInt(event.target.value);
        setPagination(prev => ({ ...prev, limit: newLimit }));
        fetchLeads(1, newLimit);
    };

    const handleNextPage = () => {
        if (pagination.hasNextPage) {
            fetchLeads(pagination.currentPage + 1);
        }
    };

    const handlePrevPage = () => {
        if (pagination.hasPrevPage) {
            fetchLeads(pagination.currentPage - 1);
        }
    };

    const getStatusChip = (status) => {
        const statusColors = {
            New: { color: "primary", variant: "outlined" },
            "Call Back": { color: "warning", variant: "outlined" },
            "Not Active": { color: "error", variant: "outlined" },
            "Active": { color: "success", variant: "filled" },
            "Not Interested": { color: "default", variant: "outlined" },
        };

        const config = statusColors[status] || statusColors.New;

        return (
            <Chip
                label={status}
                color={config.color}
                variant={config.variant}
                size="small"
                sx={{ fontWeight: 600 }}
            />
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return "";
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const handleFilterChange = (field, value) => {
        setFilters((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const toggleExpandLead = (leadId) => {
        setExpandedLead(expandedLead === leadId ? null : leadId);
    };
    const handleExportLeads = async () => {
        try {
            toast.info('Preparing export...');

            const response = await exportLeadsApi(filters);


            // Check if response.data is a Blob
            if (response.data instanceof Blob) {
                // Create download link directly from the blob
                const url = window.URL.createObjectURL(response.data);
                const link = document.createElement('a');
                link.href = url;

                // Get filename from headers
                const contentDisposition = response.headers['content-disposition'];
                let filename = `leads-${new Date().toISOString().split('T')[0]}.csv`;

                if (contentDisposition) {
                    const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/);
                    if (filenameMatch) {
                        filename = filenameMatch[1];
                    }
                }

                link.setAttribute('download', filename);
                document.body.appendChild(link);
                link.click();

                // Clean up
                window.URL.revokeObjectURL(url);
                document.body.removeChild(link);

                toast.success('Leads exported successfully!');
            } else {
                // Fallback: create blob from response data
                const blob = new Blob([response.data], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `leads-${new Date().toISOString().split('T')[0]}.csv`);
                document.body.appendChild(link);
                link.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(link);
                toast.success('Leads exported successfully!');
            }

        } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to export leads');
        }
    };
    return (
        <Box sx={{ display: "block", height: "100vh", bgcolor: "grey.50" }}>
            {/* Sidebar */}

            <Box
                sx={{
                    // display: {
                    //     xs: "none", // hide on mobile
                    //     md: "block", // show on desktop
                    // },

                }}
            >
                <Sidebar
                    setisMobileMenu={setisMobileMenu}
                    isMobileMenu={isMobileMenu}
                    isCollapsed={isSidebarCollapsed}
                    setIsSidebarCollapsed={setIsSidebarCollapsed}
                />
            </Box>

            {/* Main Content */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    display: "flex",
                    flexDirection: "column",
                    ml: {
                        xs: 0, // for mobile (0 - 600px) 
                        md: isSidebarCollapsed ? "80px" : "280px", // from 900px+
                    },
                    transition: "margin-left 0.3s ease",
                }}
            >
                {/* Header */}
                <AppBar
                    position="static"
                    elevation={0}
                    sx={{ bgcolor: "background.paper", borderBottom: 1, borderColor: "divider" }}
                >
                    <Toolbar sx={{ justifyContent: "space-between" }}>
                        <Box 
                            sx={{ display: "flex", alignItems: "center",gap:"10px" }}>
                            <IconButton

                                onClick={() => setisMobileMenu(!isMobileMenu)}
                                size="small"
                                sx={{
                                    color: 'text.secondary', display: {
                                        xs: 'block',
                                        md: 'none'
                                    }
                                }}
                            >
                                <MenuIcon />
                            </IconButton>
                            <Box>
                                <Typography variant="h5" fontWeight="bold" color="text.primary">
                                    Leads Management
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Track and manage your sales pipeline
                                </Typography>
                            </Box>
                        </Box>
                    </Toolbar>
                </AppBar>

                {/* Main Content Area */}
                <Box sx={{ flex: 1, overflow: "auto", p: 3 }}>
                    {/* Bulk Actions Bar */}
                    {selectedLeads.size > 0 && (
                    <Card elevation={2} sx={{ mb: 3, borderRadius: 3, bgcolor: 'primary.light' }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="body1" fontWeight="bold">
                                        {selectedLeads.size} lead(s) selected
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                    {authUser().user.role === 'superadmin' && (
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            startIcon={<People />}
                                            onClick={() => setAssignDialogOpen(true)}
                                        >
                                            Assign
                                        </Button>
                                    )}
                                        <Button
                                            variant="outlined"
                                            startIcon={<DeselectOutlined />}
                                            onClick={() => setSelectedLeads(new Set())}
                                        >
                                            Deselect All
                                        </Button>
                                        <Button
                                            variant="contained"
                                            color="error"
                                            startIcon={<DeleteSweep />}
                                            onClick={() => handleDeleteClick('bulk')}
                                        >
                                            Delete Selected ({selectedLeads.size})
                                        </Button>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    )}

                    {/* Action Bar */}
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                        <Box>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                                All Leads
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Manage your leads and track conversions
                            </Typography>
                        </Box>
                        <Box sx={{ display: "flex", gap: 2 }}>
                            <Button
                                variant="outlined"
                                startIcon={<Download />}
                                onClick={handleExportLeads}
                                disabled={loading}
                                sx={{ borderRadius: 2 }}
                            >
                                Export
                            </Button>
                            {leads.length > 0 && (
                                <Button
                                    variant="outlined"
                                    color="error"
                                    startIcon={<Delete />}
                                    sx={{ borderRadius: 2 }}
                                    onClick={() => handleDeleteClick('all')}
                                >
                                    Delete All
                                </Button>
                            )}
                            <Button
                                variant="contained"
                                startIcon={<Add />}
                                sx={{ borderRadius: 2 }}
                                onClick={() => setCreateDialogOpen(true)}
                            >
                                Create Lead
                            </Button>
                        </Box>
                    </Box>

                    {/* Filters Card */}
                    <Card elevation={2} sx={{ mb: 3, borderRadius: 3 }}>
                        <CardContent>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
                                <FilterList color="action" />
                                <Typography variant="h6" fontWeight="bold">
                                    Filters & Search
                                </Typography>
                            </Box>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6} md={3}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        placeholder="Search leads..."
                                        value={filters.search}
                                        onChange={(e) => handleFilterChange("search", e.target.value)}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Search />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Status</InputLabel>
                                        <Select
                                            value={filters.status}
                                            label="Status"
                                            onChange={(e) => handleFilterChange("status", e.target.value)}
                                        >
                                            <MenuItem value="">All Statuses</MenuItem>
                                            {STATUS_OPTIONS.map((status) => (
                                                <MenuItem key={status} value={status}>
                                                    {status}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Country</InputLabel>
                                        <Select
                                            value={filters.country}
                                            label="Country"
                                            onChange={(e) => handleFilterChange("country", e.target.value)}
                                        >
                                            <MenuItem value="">All Countries</MenuItem>
                                            {countries.map((country) => (
                                                <MenuItem key={country} value={country}>
                                                    {country}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                {authUser().user.role === 'superadmin' ? <Grid item xs={12} sm={6} md={3}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Agent</InputLabel>
                                        <Select
                                            value={filters.agent}
                                            label="Agent"
                                            onChange={(e) => handleFilterChange("agent", e.target.value)}
                                        >
                                            <MenuItem value="">All Agents</MenuItem>
                                            {agents.map((agent) => (
                                                <MenuItem key={agent._id} value={agent._id}>
                                                    {agent.firstName}{" "}{agent.lastName}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid> : ""}
                            </Grid>
                        </CardContent>
                    </Card>

                    {/* Leads Table */}
                    <Card elevation={2} sx={{ borderRadius: 3 }}>
                        <TableContainer>
                            {loading ? (
                                <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 400 }}>
                                    <CircularProgress />
                                </Box>
                            ) : (
                                <>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell padding="checkbox">
                                                    <MuiCheckbox
                                                        indeterminate={selectedLeads.size > 0 && selectedLeads.size < leads.length}
                                                        checked={leads.length > 0 && selectedLeads.size === leads.length}
                                                        onChange={handleSelectAll}
                                                    />
                                                </TableCell>
                                                <TableCell />
                                                <TableCell sx={{ fontWeight: "bold", color: "text.secondary" }}>
                                                    Contact
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: "bold", color: "text.secondary" }}>
                                                    Phone
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: "bold", color: "text.secondary" }}>
                                                    Country
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: "bold", color: "text.secondary" }}>
                                                    Brand
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: "bold", color: "text.secondary" }}>
                                                    Agent
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: "bold", color: "text.secondary" }}>
                                                    Status
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: "bold", color: "text.secondary" }}>
                                                    Created
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: "bold", color: "text.secondary" }}>
                                                    Actions
                                                </TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {leads.map((lead) => (
                                                <React.Fragment key={lead._id}>
                                                    <TableRow hover>
                                                        <TableCell padding="checkbox">
                                                            <MuiCheckbox
                                                                checked={selectedLeads.has(lead._id)}
                                                                onChange={() => handleSelectLead(lead._id)}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => toggleExpandLead(lead._id)}
                                                            >
                                                                {expandedLead === lead._id ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                                                            </IconButton>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Box>
                                                                <Typography variant="body2" fontWeight="bold">
                                                                    {lead.firstName} {lead.lastName}
                                                                </Typography>
                                                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                                                                    <Email sx={{ fontSize: 16, color: "text.secondary" }} />
                                                                    <Typography variant="caption" color="text.secondary">
                                                                        {lead.email}
                                                                    </Typography>
                                                                </Box>
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                                <Phone sx={{ fontSize: 16, color: "text.secondary" }} />
                                                                <Typography variant="body2">{lead.phone}</Typography>
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2">{lead.country}</Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2" fontWeight="medium">
                                                                {lead.Brand}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2" fontWeight="medium">
                                                                {lead.agent ? `${lead.agent.firstName} ${lead.agent.lastName}` : 'Unassigned'}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>{getStatusChip(lead.status)}</TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2" color="text.secondary">
                                                                {formatDate(lead.createdAt)}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <IconButton
                                                                size="small"
                                                                onClick={(e) => handleMenuOpen(e, lead)}
                                                            >
                                                                <MoreVert />
                                                            </IconButton>
                                                        </TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={10}>
                                                            <Collapse in={expandedLead === lead._id} timeout="auto" unmountOnExit>
                                                                <Box sx={{ margin: 1, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                                                                    <Grid container spacing={2}>
                                                                        <Grid item xs={12} sm={6} md={3}>
                                                                            <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                                                                            <Typography variant="body2">{lead.email}</Typography>
                                                                        </Grid>
                                                                        <Grid item xs={12} sm={6} md={3}>
                                                                            <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
                                                                            <Typography variant="body2">{lead.phone || 'Not provided'}</Typography>
                                                                        </Grid>
                                                                        <Grid item xs={12} sm={6} md={3}>
                                                                            <Typography variant="subtitle2" color="text.secondary">Country</Typography>
                                                                            <Typography variant="body2">{lead.country || 'Not provided'}</Typography>
                                                                        </Grid>
                                                                        <Grid item xs={12} sm={6} md={3}>
                                                                            <Typography variant="subtitle2" color="text.secondary">Brand</Typography>
                                                                            <Typography variant="body2">{lead.Brand || 'Not provided'}</Typography>
                                                                        </Grid>
                                                                        <Grid item xs={12}>
                                                                            <Typography variant="subtitle2" color="text.secondary">Address</Typography>
                                                                            <Typography variant="body2">{lead.Address || 'Not provided'}</Typography>
                                                                        </Grid>
                                                                        <Grid item xs={12}>
                                                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                                                <Button
                                                                                    size="small"
                                                                                    startIcon={<Visibility />}
                                                                                    onClick={() => {
                                                                                        setSelectedLead(lead);
                                                                                        setViewDetailsOpen(true);
                                                                                    }}
                                                                                >
                                                                                    View Details
                                                                                </Button>
                                                                                <Button
                                                                                    size="small"
                                                                                    startIcon={<Edit />}
                                                                                    onClick={() => {
                                                                                        setSelectedLead(lead);
                                                                                        setEditDialogOpen(true);
                                                                                    }}
                                                                                >
                                                                                    Edit
                                                                                </Button>
                                                                                <Button
                                                                                    size="small"
                                                                                    color="error"
                                                                                    startIcon={<Delete />}
                                                                                    onClick={() => handleDeleteClick('single', lead)}
                                                                                >
                                                                                    Delete
                                                                                </Button>
                                                                            </Box>
                                                                        </Grid>
                                                                    </Grid>
                                                                </Box>
                                                            </Collapse>
                                                        </TableCell>
                                                    </TableRow>
                                                </React.Fragment>
                                            ))}
                                            {leads.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={10} align="center" sx={{ py: 8 }}>
                                                        <Search sx={{ fontSize: 48, color: "grey.300", mb: 2 }} />
                                                        <Typography variant="h6" color="text.secondary" gutterBottom>
                                                            No leads found
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                            Try adjusting your filters or create a new lead
                                                        </Typography>
                                                        <Button
                                                            variant="contained"
                                                            startIcon={<Add />}
                                                            onClick={() => setCreateDialogOpen(true)}
                                                        >
                                                            Create Your First Lead
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>

                                    {/* Enhanced Pagination */}
                                    {leads.length > 0 && (
                                        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                                                {/* Page Size Selector */}
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Rows per page:
                                                    </Typography>
                                                    <Select
                                                        size="small"
                                                        value={pagination.limit}
                                                        onChange={handleLimitChange}
                                                        sx={{ minWidth: 80 }}
                                                    >
                                                        <MenuItem value={50}>50</MenuItem>
                                                        <MenuItem value={100}>100</MenuItem>
                                                        <MenuItem value={150}>150</MenuItem>
                                                        <MenuItem value={200}>200</MenuItem>
                                                    </Select>
                                                </Box>

                                                {/* Pagination Info */}
                                                <Typography variant="body2" color="text.secondary">
                                                    Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{' '}
                                                    {Math.min(pagination.currentPage * pagination.limit, pagination.totalFiltered)} of{' '}
                                                    {pagination.totalFiltered} results
                                                    {pagination.totalFiltered !== pagination.totalLeads && (
                                                        <span> (filtered from {pagination.totalLeads} total)</span>
                                                    )}
                                                </Typography>

                                                {/* Pagination Controls */}
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Button
                                                        size="small"
                                                        onClick={handlePrevPage}
                                                        disabled={!pagination.hasPrevPage}
                                                        startIcon={<NavigateBefore />}
                                                    >
                                                        Previous
                                                    </Button>

                                                    <Pagination
                                                        count={pagination.totalPages}
                                                        page={pagination.currentPage}
                                                        onChange={handlePageChange}
                                                        color="primary"
                                                        size="small"
                                                        showFirstButton
                                                        showLastButton
                                                    />

                                                    <Button
                                                        size="small"
                                                        onClick={handleNextPage}
                                                        disabled={!pagination.hasNextPage}
                                                        endIcon={<NavigateNext />}
                                                    >
                                                        Next
                                                    </Button>
                                                </Box>
                                            </Box>
                                        </Box>
                                    )}
                                </>
                            )}
                        </TableContainer>
                    </Card>
                </Box>
            </Box>

            {/* Actions Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                    elevation: 3,
                    sx: { borderRadius: 2, minWidth: 160 },
                }}
            >
                <MenuItem onClick={handleViewDetails}>
                    <Visibility sx={{ mr: 1, fontSize: 20 }} />
                    View Details
                </MenuItem>
                <MenuItem onClick={handleEditLead}>
                    <Edit sx={{ mr: 1, fontSize: 20 }} />
                    Edit Lead
                </MenuItem>
                <MenuItem onClick={handleDeleteLead} sx={{ color: "error.main" }}>
                    <Delete sx={{ mr: 1, fontSize: 20 }} />
                    Delete
                </MenuItem>
            </Menu>

            {/* Create Lead Dialog */}
            <CreateLeadDialog
                open={createDialogOpen}
                onClose={() => setCreateDialogOpen(false)}
                onLeadCreated={handleLeadCreated}
                agents={agents}
                currentUser={currentAuthUser}
            />

            {/* View Details Dialog */}
            <LeadDetails
                lead={selectedLead}
                open={viewDetailsOpen}
                onClose={() => setViewDetailsOpen(false)}
            />

            {/* Edit Lead Dialog */}
            <EditLeadDialog
                lead={selectedLead}
                open={editDialogOpen}
                onClose={() => setEditDialogOpen(false)}
                onLeadUpdated={handleLeadUpdated}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
                <DialogTitle>
                    Confirm Delete
                </DialogTitle>
                <DialogContent>
                    <Typography>
                        {deleteType === 'single' && `Are you sure you want to delete ${selectedLead?.firstName} ${selectedLead?.lastName}?`}
                        {deleteType === 'bulk' && `Are you sure you want to delete ${selectedLeads.size} selected leads?`}
                        {deleteType === 'all' && 'Are you sure you want to delete ALL leads? This action cannot be undone.'}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleDeleteConfirm}
                        disabled={deleting}
                    >
                        {deleting ? <CircularProgress size={24} /> : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Assign Leads Dialog */}
            <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)}>
                <DialogTitle>Assign Selected Leads</DialogTitle>
                <DialogContent>
                    <Typography sx={{ mb: 2 }}>Select an agent to assign {selectedLeads.size} lead(s):</Typography>
                    <FormControl fullWidth size="small">
                        <InputLabel>Agent</InputLabel>
                        <Select
                            value={selectedAgentId}
                            label="Agent"
                            onChange={(e) => setSelectedAgentId(e.target.value)}
                        >
                            {agents
                                .filter(a => a.role === 'admin' || a.role === 'subadmin' || a.role === 'superadmin')
                                .map(agent => (
                                    <MenuItem key={agent._id} value={agent._id}>
                                        {agent.firstName} {agent.lastName} ({agent.role}){currentAuthUser?.user?._id === agent._id ? ' (self)' : ''}
                                    </MenuItem>
                                ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={async () => {
                            try {
                                if (!selectedAgentId) {
                                    toast.error('Please select an agent');
                                    return;
                                }
                                setAssigning(true);
                                const res = await assignLeadsApi(Array.from(selectedLeads), selectedAgentId);
                                if (res.success) {
                                    toast.success(res.msg || 'Leads assigned successfully');
                                    setAssignDialogOpen(false);
                                    setSelectedAgentId("");
                                    setSelectedLeads(new Set());
                                    fetchLeads(pagination.currentPage);
                                } else {
                                    toast.error(res.msg || 'Failed to assign leads');
                                }
                            } catch (err) {
                                console.error('Assign error:', err);
                                toast.error('Error assigning leads');
                            } finally {
                                setAssigning(false);
                            }
                        }}
                        disabled={assigning || selectedLeads.size === 0}
                    >
                        {assigning ? <CircularProgress size={24} /> : 'Assign'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default LeadsPage;