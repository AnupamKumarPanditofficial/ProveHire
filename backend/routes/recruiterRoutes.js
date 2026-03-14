const express = require('express');
const router = express.Router();
const { verifyRecruiterToken } = require('../middleware/authMiddleware');
const {
    getDashboardStats,
    getJobs,
    createJob,
    updateJob,
    deleteJob,
    getJobApplicants,
    getAllApplicants,
} = require('../controllers/recruiterController');

const auth = [verifyRecruiterToken];

// Dashboard
router.get('/dashboard/stats', ...auth, getDashboardStats);

// Jobs CRUD
router.get('/jobs', ...auth, getJobs);
router.post('/jobs', ...auth, createJob);
router.patch('/jobs/:id', ...auth, updateJob);
router.delete('/jobs/:id', ...auth, deleteJob);

// Applicants
router.get('/jobs/:id/applicants', ...auth, getJobApplicants);
router.get('/applicants', ...auth, getAllApplicants);

module.exports = router;
