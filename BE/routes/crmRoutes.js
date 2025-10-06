let express = require("express");

const { authorizedRoles, isAuthorizedUser, checkCrmAccess } = require("../middlewares/auth");

const singleUpload = require("../middlewares/multer");
const { uploadCSV, loginCRM, getLeads, exportLeads, createLead, deleteLead, deleteAllLeads, bulkDeleteLeads, editLead } = require("../controllers/crmController");
const multer = require('multer');

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
});
let router = express.Router();

router.route('/crm/login').post(loginCRM);
router.route('/crm/uploadLeads').post(isAuthorizedUser, authorizedRoles("superadmin", "admin", "subadmin"), checkCrmAccess, upload.single('file'), uploadCSV);
// router.route('/crm/uploadLeads').post(uploadCSV);
router.route('/crm/createLead').post(isAuthorizedUser, authorizedRoles("superadmin", "admin", "subadmin"), checkCrmAccess, createLead);
router.route('/crm/getLeads').get(isAuthorizedUser, authorizedRoles("superadmin", "admin", "subadmin"), checkCrmAccess, getLeads);
router.route('/crm/getLeads').get(isAuthorizedUser, authorizedRoles("superadmin", "admin", "subadmin"), checkCrmAccess, getLeads);
router.route('/crm/deleteLead/:id').delete(isAuthorizedUser,
    authorizedRoles("superadmin", "admin", "subadmin"), checkCrmAccess, deleteLead);
router.route('/crm/deleteAllLeads').delete(isAuthorizedUser,
    authorizedRoles("superadmin", "admin", "subadmin"), checkCrmAccess, deleteAllLeads);
router.route('/crm/bulkDeleteLeads').post(isAuthorizedUser,
    authorizedRoles("superadmin", "admin", "subadmin"), checkCrmAccess, bulkDeleteLeads);
router.route('/crm/editLead/:id').patch(isAuthorizedUser,
    authorizedRoles("superadmin", "admin", "subadmin"), checkCrmAccess, editLead);
router.route('/exportLeads').get(isAuthorizedUser,
    authorizedRoles("superadmin", "admin", "subadmin"), checkCrmAccess, exportLeads);
// router.route('/crm/leads').get(isAuthorizedUser, authorizedRoles("superadmin", "admin", "subadmin"), uploadCSV);

module.exports = router;
