// controllers/crmController.js
const getLeadModel = require('../crmDB/models/leadsModel');
const csv = require('csv-parser');
const fs = require('fs');
const User = require('../models/userModel'); // from main DB

const jwtToken = require('../utils/jwtToken');
const catchAsyncErrors = require('../middlewares/catchAsyncErrors');
const ErrorHandler = require('../utils/errorHandler');

const stream = require('stream');

// Escape user input for safe use in regex
function escapeRegex(text) {
    return text && typeof text === 'string'
        ? text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        : text;
}

exports.loginCRM = catchAsyncErrors(async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const admin = await User.findOne({ email, role: { $in: ['admin', 'superadmin', 'subadmin'] } });

        if (!admin) return next(new ErrorHandler('Access denied', 400))
        if (admin.password != password) {
            return next(new ErrorHandler("Invalid Email or Password", 500));
        }

        jwtToken(admin, 200, res);


    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});



exports.createLead = catchAsyncErrors(async (req, res, next) => {

    try {

        const {
            firstName,
            lastName,
            email,
            phone,
            country,
            Brand,
            Address,
            status = 'New',
            agentId,
        } = req.body;

        if (!firstName || !lastName || !email) {
            return res.status(400).json({
                success: false,
                msg: 'First name, last name, and email are required'
            });
        }

        // Get Lead model

        const Lead = await getLeadModel();
        const existingLead = await Lead.findOne({ email, isDeleted: false });
        if (existingLead) {
            return res.status(400).json({
                success: false,
                msg: 'A lead with this email already exists'
            });
        }

        // Decide agent assignment
        let assignedAgent = null;
        if (req.user && req.user.role === 'superadmin' && agentId) {
            const agentUser = await User.findById(agentId);
            if (!agentUser) return res.status(404).json({ success: false, msg: 'Agent user not found' });
            if (!['admin', 'subadmin', 'superadmin'].includes(agentUser.role)) {
                return res.status(400).json({ success: false, msg: 'Agent must be an admin, subadmin, or superadmin' });
            }
            assignedAgent = agentUser._id;
        } else if (req.user && req.user.role !== 'superadmin') {
            assignedAgent = req.user._id;
        } else {
            assignedAgent = null; // superadmin without agent selection leaves unassigned
        }

        // Create new lead
        const newLead = new Lead({
            firstName,
            lastName,
            email,
            phone,
            country: country ? String(country).trim() : undefined,
            Brand,
            Address,
            status,
            agent: assignedAgent,
        });

        await newLead.save();

        res.status(201).json({
            success: true,
            msg: 'Lead created successfully',
            data: { lead: newLead }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lead creation failed' });
    }
});
exports.uploadCSV = catchAsyncErrors(async (req, res, next) => {

    try {

        console.log('req.file: ', req.file);
        const Lead = await getLeadModel();
        if (!req.file) {
            return res.status(400).json({
                success: false,
                msg: 'No file uploaded'
            });
        }

        const fieldMapping = JSON.parse(req.body.fieldMapping || '{}');
        const selectedFields = JSON.parse(req.body.selectedFields || '{}');
        const incomingAgentId = req.body.agentId;

        // Resolve assignment agent once per upload
        if (req.user && req.user.role === 'admin') {
            // Admin must have permission to manage CRM leads
            const me = await User.findById(req.user._id).select('adminPermissions');
            if (!me?.adminPermissions?.canManageCrmLeads) {
                return res.status(403).json({ success: false, msg: 'CRM leads management not allowed for admin' });
            }
        }
        let uploadAssignedAgent = null;
        if (req.user && req.user.role === 'superadmin' && incomingAgentId) {
            const agentUser = await User.findById(incomingAgentId);
            if (!agentUser) {
                return res.status(404).json({ success: false, msg: 'Agent user not found' });
            }
            if (!['admin', 'subadmin', 'superadmin'].includes(agentUser.role)) {
                return res.status(400).json({ success: false, msg: 'Agent must be an admin, subadmin, or superadmin' });
            }
            uploadAssignedAgent = agentUser._id;
        } else if (req.user && ['admin', 'subadmin'].includes(req.user.role)) {
            uploadAssignedAgent = req.user._id;
        } else {
            uploadAssignedAgent = null; // superadmin may leave unassigned
        }

        const results = [];
        const errors = [];
        const bufferStream = new stream.PassThrough();
        bufferStream.end(req.file.buffer);
        await new Promise((resolve, reject) => {
            bufferStream
                .pipe(csv())
                .on('data', (data) => {
                    try {
                        const mappedData = {};
                        let hasRequiredFields = true;

                        // Map fields according to user selection
                        Object.keys(selectedFields).forEach(fieldKey => {
                            if (selectedFields[fieldKey] && fieldMapping[fieldKey]) {
                                const csvValue = data[fieldMapping[fieldKey]];
                                if (csvValue !== undefined && csvValue !== '') {
                                    mappedData[fieldKey] = csvValue;
                                }
                            }
                        });

                        // Check required fields
                        if (!mappedData.firstName || !mappedData.lastName || !mappedData.email) {
                            errors.push({
                                row: results.length + 1,
                                error: 'Missing required fields (firstName, lastName, email)',
                                data: mappedData
                            });
                            return;
                        }

                        // Clean and validate data
                        const cleanData = {
                            firstName: mappedData.firstName ? mappedData.firstName.trim() : '',
                            lastName: mappedData.lastName ? mappedData.lastName.trim() : '',
                            email: mappedData.email ? mappedData.email.trim().toLowerCase() : '',
                            phone: mappedData.phone ? mappedData.phone.trim() : '',
                            country: mappedData.country ? mappedData.country.trim() : '',
                            Brand: mappedData.Brand ? mappedData.Brand.trim() : '',
                            Address: mappedData.Address ? mappedData.Address.trim() : '',
                            status: mappedData.status && ['New', 'Call Back', 'Not Active', 'Active', "Not Interested"].includes(mappedData.status)
                                ? mappedData.status
                                : 'New',
                            agent: uploadAssignedAgent,
                        };

                        results.push(cleanData);
                    } catch (rowError) {
                        errors.push({
                            row: results.length + 1,
                            error: `Row processing error: ${rowError.message}`,
                            data
                        });
                    }
                })
                .on('end', resolve)
                .on('error', reject);
        });

        if (results.length === 0) {
            return res.status(400).json({
                success: false,
                msg: 'No valid data found in CSV file',
                errors
            });
        }

        // Process leads in batches
        const BATCH_SIZE = 50;
        const processedLeads = [];
        const skippedLeads = [];

        for (let i = 0; i < results.length; i += BATCH_SIZE) {
            const batch = results.slice(i, i + BATCH_SIZE);

            for (const leadData of batch) {
                try {
                    // Check for duplicate email
                    const existingLead = await Lead.findOne({
                        email: leadData.email,
                        isDeleted: false
                    });
                    if (existingLead) {
                        skippedLeads.push({
                            email: leadData.email,
                            reason: 'Duplicate email'
                        });
                        continue;
                    }

                    const newLead = new Lead(leadData);
                    await newLead.save();
                    processedLeads.push(newLead);
                } catch (error) {
                    skippedLeads.push({
                        email: leadData.email,
                        reason: error.message
                    });
                }
            }
        }

        res.json({
            success: true,
            msg: `Successfully processed ${processedLeads.length} leads${skippedLeads.length > 0 ? `, ${skippedLeads.length} skipped` : ''}`,
            data: {
                processed: processedLeads.length,
                skipped: skippedLeads.length,
                details: {
                    processedLeads: processedLeads.map(lead => ({
                        id: lead._id,
                        name: `${lead.firstName} ${lead.lastName}`,
                        email: lead.email
                    })),
                    skippedLeads,
                    errors: errors.length > 0 ? errors : undefined
                }
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Upload failed' });
    }
});


// GET /api/leads
exports.getLeads = async (req, res) => {
    try {
        const Lead = await getLeadModel();
         
        const {
            search,
            status,
            country,
            agent,
            page = 1,
            limit = 100,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build query
        const query = { isDeleted: false };

        if (search) {
            const searchTrimmed = String(search).trim();
            const regexGlobal = { $regex: searchTrimmed, $options: "i" };
            const nameRegex = new RegExp(escapeRegex(searchTrimmed), 'i');
            const parts = searchTrimmed.split(/\s+/);

            query.$or = [
                { firstName: regexGlobal },
                { lastName: regexGlobal },
                { email: regexGlobal },
                { phone: regexGlobal },
                { Brand: regexGlobal },
                { Address: regexGlobal },
                // Full name contains search (e.g., "john doe")
                { $expr: { $regexMatch: { input: { $concat: ['$firstName', ' ', '$lastName'] }, regex: nameRegex } } }
            ];

            if (parts.length >= 2) {
                const first = new RegExp(escapeRegex(parts[0]), 'i');
                const last = new RegExp(escapeRegex(parts.slice(1).join(' ')), 'i');
                // Match first and last separately in either order
                query.$or.push({ $and: [{ firstName: first }, { lastName: last }] });
                query.$or.push({ $and: [{ firstName: last }, { lastName: first }] });
            }
        }

        if (status && status !== '') query.status = status;
        if (country && country !== '') {
            // Case-insensitive, whitespace-tolerant country match
            const countryPattern = new RegExp(`^${escapeRegex(String(country).trim())}$`, 'i');
            query.country = countryPattern;
        }
        if (agent && agent !== '') query.agent = agent;

        // Visibility rules
        if (req.user && req.user.role === 'subadmin') {
            // Subadmin: only own leads
            query.agent = req.user._id;
        } else if (req.user && req.user.role === 'admin') {
            // Admin: own leads + subadmins' leads only if allowed
            const me = await User.findById(req.user._id).select('adminPermissions');
            if (me?.adminPermissions?.canManageCrmLeads) {
                const subadmins = await User.find({ role: 'subadmin' }).select('_id');
                const subadminIds = subadmins.map(u => u._id);
                query.agent = { $in: [req.user._id, ...subadminIds] };
            } else {
                query.agent = req.user._id;
            }
        }

        // Parse pagination parameters
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Validate pagination
        if (pageNum < 1 || limitNum < 1) {
            return res.status(400).json({
                success: false,
                message: "Invalid pagination parameters"
            });
        }

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Get leads without population first
        const leads = await Lead.find(query)
            .sort(sort)
            .skip(skip)
            .limit(limitNum)
            .lean(); // Use lean() for better performance

        // Manually populate agent data
        const agentIds = leads.map(lead => lead.agent).filter(id => id);
        const agents = await User.find({ _id: { $in: agentIds } })
            .select('firstName lastName email role')
            .lean();

        const agentMap = agents.reduce((map, agent) => {
            map[agent._id.toString()] = agent;
            return map;
        }, {});

        // Combine leads with agent data
        const populatedLeads = leads.map(lead => ({
            ...lead,
            agent: lead.agent ? agentMap[lead.agent.toString()] : null
        }));

        // Get counts
        const [totalLeads, totalFiltered] = await Promise.all([
            Lead.countDocuments({ isDeleted: false }),
            Lead.countDocuments(query)
        ]);

        // Calculate pagination info
        const totalPages = Math.ceil(totalFiltered / limitNum);
        const hasNextPage = pageNum < totalPages;
        const hasPrevPage = pageNum > 1;

        res.status(200).json({
            success: true,
            data: {
                leads: populatedLeads,
                pagination: {
                    currentPage: pageNum,
                    totalPages,
                    totalLeads,
                    totalFiltered,
                    hasNextPage,
                    hasPrevPage,
                    limit: limitNum,
                    nextPage: hasNextPage ? pageNum + 1 : null,
                    prevPage: hasPrevPage ? pageNum - 1 : null
                }
            }
        });
    } catch (err) {
        console.error("Error fetching leads:", err);
        res.status(500).json({
            success: false,
            message: "Server Error",
            error: err.message
        });
    }
};
// Assign or reassign multiple leads to a specific agent (admin or subadmin)
exports.assignLeadsToAgent = async (req, res) => {
    try {
        const Lead = await getLeadModel();
      
        const { leadIds, agentId } = req.body;

        if (!Array.isArray(leadIds) || leadIds.length === 0 || !agentId) {
            return res.status(400).json({ success: false, msg: 'agentId and leadIds are required' });
        }

        // Validate target agent exists and has appropriate role
        const agentUser = await User.findById(agentId);
        if (!agentUser) {
            return res.status(404).json({ success: false, msg: 'Agent user not found' });
        }
        if (!['admin', 'subadmin'].includes(agentUser.role)) {
            return res.status(400).json({ success: false, msg: 'Agent must be an admin or subadmin' });
        }

        // If requester is admin, ensure they have permission and can only assign to subadmins
        if (req.user && req.user.role === 'admin') {
            const me = await User.findById(req.user._id).select('adminPermissions');
            if (!me?.adminPermissions?.canManageCrmLeads) {
                return res.status(403).json({ success: false, msg: 'CRM leads assignment not allowed for admin' });
            }
            if (agentUser.role !== 'subadmin') {
                return res.status(400).json({ success: false, msg: 'Admins can assign only to subadmins' });
            }
        }

        // Update leads in bulk
        const result = await Lead.updateMany(
            { _id: { $in: leadIds }, isDeleted: false },
            { $set: { agent: agentId, updatedAt: new Date() } }
        );

        return res.status(200).json({
            success: true,
            msg: `${result.modifiedCount} lead(s) assigned to ${agentUser.firstName} ${agentUser.lastName}`,
            data: { modifiedCount: result.modifiedCount }
        });
    } catch (err) {
        console.error('Error assigning leads:', err);
        return res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};

exports.deleteLead = async (req, res) => {
    try {
        const Lead = await getLeadModel();
        const lead = await Lead.findById(req.params.id);
        console.log('req.params.id: ', req.params.id);

        if (!lead) {
            return res.status(404).json({
                success: false,
                msg: 'Lead not found'
            });
        }

        // Soft delete by setting isDeleted to true and timestamp
        lead.isDeleted = true;
        lead.deletedAt = new Date();
        await lead.save();

        res.status(200).json({
            success: true,
            msg: 'Lead deleted successfully'
        });
    } catch (err) {
        console.error("Error fetching leads:", err);
        res.status(500).json({
            success: false,
            message: "Server Error",
            error: err.message
        });
    }
};
exports.bulkDeleteLeads = async (req, res) => {
    try {
        const { leadIds } = req.body;
        console.log('req.body: ', req.body);
        const Lead = await getLeadModel();

        if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
            return res.status(400).json({
                success: false,
                msg: 'No lead IDs provided'
            });
        }

        const result = await Lead.updateMany(
            { _id: { $in: leadIds } },
            { $set: { isDeleted: true, deletedAt: new Date() } }
        );

        res.status(200).json({
            success: true,
            msg: `${result.modifiedCount} leads deleted successfully`,
            data: { deletedCount: result.modifiedCount }
        });


    } catch (err) {
        console.error("Error fetching leads:", err);
        res.status(500).json({
            success: false,
            message: "Server Error",
            error: err.message
        });
    }
};
exports.deleteAllLeads = async (req, res) => {
    try {
        const Lead = await getLeadModel();

        const result = await Lead.updateMany(
            { isDeleted: false },
            { $set: { isDeleted: true, deletedAt: new Date() } }
        );

        res.status(200).json({
            success: true,
            msg: `All ${result.modifiedCount} leads deleted successfully`,
            data: { deletedCount: result.modifiedCount }
        });


    } catch (err) {
        console.error("Error fetching leads:", err);
        res.status(500).json({
            success: false,
            message: "Server Error",
            error: err.message
        });
    }
};
exports.editLead = async (req, res) => {
    try {
        const Lead = await getLeadModel();
        const {
            firstName,
            lastName,
            email,
            phone,
            country,
            Brand,
            Address,
            status,
        } = req.body;

        // Validation
        if (!firstName || !lastName || !email) {
            return res.status(400).json({
                success: false,
                msg: 'First name, last name, and email are required'
            });
        }

        const lead = await Lead.findById(req.params.id);
        if (!lead) {
            return res.status(404).json({
                success: false,
                msg: 'Lead not found'
            });
        }

        // Check if email is being changed and if it conflicts with another lead
        if (email !== lead.email) {
            const existingLead = await Lead.findOne({
                email,
                isDeleted: false,
                _id: { $ne: req.params.id }
            });
            if (existingLead) {
                return res.status(400).json({
                    success: false,
                    msg: 'Another lead with this email already exists'
                });
            }
        }

        // Update lead
        lead.firstName = firstName;
        lead.lastName = lastName;
        lead.email = email;
        lead.phone = phone;
        lead.country = country;
        lead.Brand = Brand;
        lead.Address = Address;
        lead.status = status;

        await lead.save();

        res.status(200).json({
            success: true,
            msg: 'Lead updated successfully',
            data: { lead }
        });





    } catch (err) {
        console.error("Error fetching leads:", err);
        res.status(500).json({
            success: false,
            message: "Server Error",
            error: err.message
        });
    }
};
exports.exportLeads = async (req, res) => {
    try {
        console.log("an", req.query);
        const Lead = await getLeadModel();
        const { search, status, country, agent, fields } = req.query;

        // Build query (same as getLeads)
        const query = { isDeleted: false };

        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: "i" } },
                { lastName: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { phone: { $regex: search, $options: "i" } },
                { Brand: { $regex: search, $options: "i" } },
                { Address: { $regex: search, $options: "i" } }
            ];
        }

        if (status && status !== '') query.status = status;
        if (country && country !== '') query.country = country;
        if (agent && agent !== '') query.agent = agent;

        // Export visibility
        if (req.user && req.user.role === 'subadmin') {
            query.agent = req.user._id;
        } else if (req.user && req.user.role === 'admin') {
            const me = await User.findById(req.user._id).select('adminPermissions');
            if (me?.adminPermissions?.canManageCrmLeads) {
                const subadmins = await User.find({ role: 'subadmin' }).select('_id');
                const subadminIds = subadmins.map(u => u._id);
                query.agent = { $in: [req.user._id, ...subadminIds] };
            } else {
                query.agent = req.user._id;
            }
        }

        // Get all leads matching the filters (no pagination for export)
        const leads = await Lead.find(query).sort({ createdAt: -1 });

        // Define available fields and their headers
        const availableFields = {
            firstName: 'First Name',
            lastName: 'Last Name',
            email: 'Email',
            phone: 'Phone',
            country: 'Country',
            Brand: 'Brand',
            Address: 'Address',
            status: 'Status',
            createdAt: 'Created Date'
        };

        // Determine which fields to export
        let exportFields = Object.keys(availableFields);
        if (fields) {
            exportFields = fields.split(',').filter(field => availableFields[field]);
        }

        // Create CSV headers
        const headers = exportFields.map(field => availableFields[field]);
        let csvContent = headers.join(',') + '\n';

        // Create CSV rows
        leads.forEach(lead => {
            const row = exportFields.map(field => {
                let value = lead[field] || '';

                // Format dates
                if (field === 'createdAt') {
                    value = new Date(value).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    });
                }

                // Escape CSV special characters and wrap in quotes
                return `"${String(value).replace(/"/g, '""')}"`;
            });
            csvContent += row.join(',') + '\n';
        });

        // Set response headers for file download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=leads-export-${new Date().toISOString().split('T')[0]}.csv`);

        res.status(200).send(csvContent);



    } catch (err) {
        console.error("Error fetching leads:", err);
        res.status(500).json({
            success: false,
            message: "Server Error",
            error: err.message
        });
    }
};

// List deleted leads (recycle bin)
exports.getDeletedLeads = async (req, res) => {
    try {
        const Lead = await getLeadModel();
        const { page = 1, limit = 100, search, status, agent } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const query = { isDeleted: true };

        if (search) {
            const searchTrimmed = String(search).trim();
            const regexGlobal = { $regex: searchTrimmed, $options: "i" };
            const nameRegex = new RegExp(escapeRegex(searchTrimmed), 'i');
            const parts = searchTrimmed.split(/\s+/);
            query.$or = [
                { firstName: regexGlobal },
                { lastName: regexGlobal },
                { email: regexGlobal },
                { phone: regexGlobal },
                { Brand: regexGlobal },
                { Address: regexGlobal },
                { $expr: { $regexMatch: { input: { $concat: ['$firstName', ' ', '$lastName'] }, regex: nameRegex } } }
            ];
            if (parts.length >= 2) {
                const first = new RegExp(escapeRegex(parts[0]), 'i');
                const last = new RegExp(escapeRegex(parts.slice(1).join(' ')), 'i');
                query.$or.push({ $and: [{ firstName: first }, { lastName: last }] });
                query.$or.push({ $and: [{ firstName: last }, { lastName: first }] });
            }
        }
        if (status && status !== '') query.status = status;
        if (agent && agent !== '') query.agent = agent;

        // Visibility: subadmin only self; admin self + subadmins (if allowed)
        if (req.user && req.user.role === 'subadmin') {
            query.agent = req.user._id;
        } else if (req.user && req.user.role === 'admin') {
            const me = await User.findById(req.user._id).select('adminPermissions');
            if (me?.adminPermissions?.canManageCrmLeads) {
                const subadmins = await User.find({ role: 'subadmin' }).select('_id');
                const subadminIds = subadmins.map(u => u._id);
                query.agent = { $in: [req.user._id, ...subadminIds] };
            } else {
                query.agent = req.user._id;
            }
        }

        const [leadsRaw, totalFiltered] = await Promise.all([
            Lead.find(query).sort({ deletedAt: -1 }).skip(skip).limit(limitNum).lean(),
            Lead.countDocuments(query)
        ]);

        // Manual populate agent from main DB
        const agentIds = leadsRaw.map(l => l.agent).filter(Boolean);
        const agents = await User.find({ _id: { $in: agentIds } }).select('firstName lastName email role').lean();
        const agentMap = agents.reduce((m, a) => { m[a._id.toString()] = a; return m; }, {});
        const leads = leadsRaw.map(l => ({
            ...l,
            agent: l.agent ? agentMap[l.agent.toString()] || null : null,
        }));

        const totalPages = Math.ceil(totalFiltered / limitNum);

        res.status(200).json({
            success: true,
            data: {
                leads,
                pagination: {
                    currentPage: pageNum,
                    totalPages,
                    totalFiltered,
                    limit: limitNum,
                }
            }
        });
    } catch (err) {
        console.error('Error fetching deleted leads:', err);
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};

// Restore a soft-deleted lead
exports.restoreLead = async (req, res) => {
    try {
        const Lead = await getLeadModel();
        const lead = await Lead.findById(req.params.id);
        if (!lead || !lead.isDeleted) return res.status(404).json({ success: false, msg: 'Lead not found or not deleted' });
        lead.isDeleted = false;
        lead.deletedAt = null;
        await lead.save();
        res.status(200).json({ success: true, msg: 'Lead restored successfully' });
    } catch (err) {
        console.error('Error restoring lead:', err);
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};

// Permanently delete a lead
exports.hardDeleteLead = async (req, res) => {
    try {
        const Lead = await getLeadModel();
        const result = await Lead.deleteOne({ _id: req.params.id, isDeleted: true });
        if (result.deletedCount === 0) return res.status(404).json({ success: false, msg: 'Lead not found or not in recycle bin' });
        res.status(200).json({ success: true, msg: 'Lead permanently deleted' });
    } catch (err) {
        console.error('Error hard deleting lead:', err);
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};

exports.bulkRestoreLeads = async (req, res) => {
    try {
        const { leadIds } = req.body;
        const Lead = await getLeadModel();
        const result = await Lead.updateMany({ _id: { $in: leadIds }, isDeleted: true }, { $set: { isDeleted: false, deletedAt: null } });
        res.status(200).json({ success: true, msg: `${result.modifiedCount} lead(s) restored`, data: { restored: result.modifiedCount } });
    } catch (err) {
        console.error('Error bulk restoring leads:', err);
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};

exports.bulkHardDeleteLeads = async (req, res) => {
    try {
        const { leadIds } = req.body;
        const Lead = await getLeadModel();
        const result = await Lead.deleteMany({ _id: { $in: leadIds }, isDeleted: true });
        res.status(200).json({ success: true, msg: `${result.deletedCount} lead(s) permanently deleted`, data: { deleted: result.deletedCount } });
    } catch (err) {
        console.error('Error bulk hard deleting leads:', err);
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};