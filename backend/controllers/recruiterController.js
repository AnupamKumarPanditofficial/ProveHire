const Job = require('../models/Job');
const Application = require('../models/Application');
const mongoose = require('mongoose');

// ─── Helper ───────────────────────────────────────────────────────────────────
const toObjectId = (id) => new mongoose.Types.ObjectId(id);

// ─── GET /api/recruiter/dashboard/stats ───────────────────────────────────────
exports.getDashboardStats = async (req, res) => {
    try {
        const recruiterId = req.recruiter._id;

        // All jobs owned by this recruiter
        const jobs = await Job.find({ recruiter: recruiterId }, '_id status title').lean();
        const jobIds = jobs.map(j => j._id);

        const totalJobPosts = jobs.length;
        const activeJobs = jobs.filter(j => j.status === 'Active').length;

        // Applicant status counts
        const statusCounts = await Application.aggregate([
            { $match: { job: { $in: jobIds } } },
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ]);

        const statusMap = {};
        statusCounts.forEach(s => { statusMap[s._id] = s.count; });

        const totalApplicants = Object.values(statusMap).reduce((a, b) => a + b, 0);
        const shortlisted = statusMap['Shortlisted'] || 0;
        const interviewsScheduled = statusMap['Interview'] || 0;
        const totalHired = statusMap['Hired'] || 0;
        const totalRejected = statusMap['Rejected'] || 0;

        // OA Sent: count of assessments linked to recruiter's job candidates
        // For now derive from User.assessmentHistory for candidates in recruiter's jobs
        const candidateIds = (await Application.find({ job: { $in: jobIds } }, 'candidate').lean())
            .map(a => a.candidate);

        const User = require('../models/User');
        const usersWithOA = await User.countDocuments({
            _id: { $in: candidateIds },
            'assessmentHistory.0': { $exists: true }
        });
        const oaSent = usersWithOA;

        // Last 30 days daily application counts (for line chart)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const dailyCounts = await Application.aggregate([
            {
                $match: {
                    job: { $in: jobIds },
                    appliedAt: { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$appliedAt' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Build last 30 days array (fill in zeros for missing days)
        const dailyData = [];
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toISOString().split('T')[0];
            const found = dailyCounts.find(x => x._id === key);
            dailyData.push({ date: key, count: found ? found.count : 0 });
        }

        // Hired vs Rejected per role (last 6 active jobs)
        const lastSixJobs = jobs.filter(j => j.status === 'Active').slice(-6);
        const hiredVsRejected = await Promise.all(lastSixJobs.map(async (job) => {
            const hired = await Application.countDocuments({ job: job._id, status: 'Hired' });
            const rejected = await Application.countDocuments({ job: job._id, status: 'Rejected' });
            return { role: job.title, hired, rejected };
        }));

        res.status(200).json({
            stats: {
                totalJobPosts,
                activeJobs,
                totalApplicants,
                shortlisted,
                interviewsScheduled,
                oaSent,
                totalHired,
                totalRejected,
            },
            applicantStatusBreakdown: [
                { name: 'Applied', value: statusMap['Applied'] || 0 },
                { name: 'Shortlisted', value: statusMap['Shortlisted'] || 0 },
                { name: 'Interview', value: statusMap['Interview'] || 0 },
                { name: 'Hired', value: statusMap['Hired'] || 0 },
                { name: 'Rejected', value: statusMap['Rejected'] || 0 },
            ],
            dailyApplications: dailyData,
            hiredVsRejected,
        });
    } catch (err) {
        console.error('getDashboardStats error:', err);
        res.status(500).json({ message: 'Server error fetching dashboard stats' });
    }
};

// ─── GET /api/recruiter/jobs ───────────────────────────────────────────────────
exports.getJobs = async (req, res) => {
    try {
        const { status, search, page = 1, limit = 100 } = req.query;
        const filter = { recruiter: req.recruiter._id };
        if (status && status !== 'All') filter.status = status;
        if (search) filter.title = { $regex: search, $options: 'i' };

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const jobs = await Job.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        // Enrich each job with applicant pipeline counts
        const enriched = await Promise.all(jobs.map(async (job) => {
            const pipeline = await Application.aggregate([
                { $match: { job: job._id } },
                { $group: { _id: '$status', count: { $sum: 1 } } },
            ]);
            const counts = {};
            pipeline.forEach(p => { counts[p._id] = p.count; });

            // Last 7 days daily applicant count for mini chart
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
            const daily = await Application.aggregate([
                { $match: { job: job._id, appliedAt: { $gte: sevenDaysAgo } } },
                { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$appliedAt' } }, count: { $sum: 1 } } },
                { $sort: { _id: 1 } }
            ]);
            const dailyChart = [];
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const key = d.toISOString().split('T')[0];
                const found = daily.find(x => x._id === key);
                dailyChart.push({ day: key, count: found ? found.count : 0 });
            }

            const totalApplicants = Object.values(counts).reduce((a, b) => a + b, 0);
            return {
                ...job,
                pipeline: {
                    applied: counts['Applied'] || 0,
                    shortlisted: counts['Shortlisted'] || 0,
                    interview: counts['Interview'] || 0,
                    hired: counts['Hired'] || 0,
                    rejected: counts['Rejected'] || 0,
                },
                totalApplicants,
                dailyChart,
            };
        }));

        const total = await Job.countDocuments(filter);
        res.status(200).json({ jobs: enriched, total, page: parseInt(page), limit: parseInt(limit) });
    } catch (err) {
        console.error('getJobs error:', err);
        res.status(500).json({ message: 'Server error fetching jobs' });
    }
};

// ─── POST /api/recruiter/jobs ──────────────────────────────────────────────────
exports.createJob = async (req, res) => {
    try {
        const { title, department, location, employmentType, experienceRange, description, skills, status, aiWeights, lastDateToApply } = req.body;

        if (!title || !department || !location || !description) {
            return res.status(400).json({ message: 'title, department, location, and description are required.' });
        }

        const job = new Job({
            recruiter: req.recruiter._id,
            title,
            department,
            location,
            employmentType,
            experienceRange,
            description,
            skills: skills || [],
            status: status || 'Draft',
            aiWeights: aiWeights || { skillScore: 40, resumeScore: 30, hireScore: 30 },
            lastDateToApply: lastDateToApply || null,
            postedAt: status === 'Active' ? new Date() : null,
        });

        await job.save();
        res.status(201).json({ message: 'Job created successfully', job });
    } catch (err) {
        console.error('createJob error:', err);
        res.status(500).json({ message: 'Server error creating job' });
    }
};

// ─── PATCH /api/recruiter/jobs/:id ────────────────────────────────────────────
exports.updateJob = async (req, res) => {
    try {
        const job = await Job.findOne({ _id: req.params.id, recruiter: req.recruiter._id });
        if (!job) return res.status(404).json({ message: 'Job not found or not authorized' });

        const fields = ['title', 'department', 'location', 'employmentType', 'experienceRange', 'description', 'skills', 'status', 'aiWeights', 'lastDateToApply'];
        fields.forEach(f => { if (req.body[f] !== undefined) job[f] = req.body[f]; });

        // If status is being set to Active for first time, set postedAt
        if (req.body.status === 'Active' && !job.postedAt) {
            job.postedAt = new Date();
        }

        await job.save();
        res.status(200).json({ message: 'Job updated successfully', job });
    } catch (err) {
        console.error('updateJob error:', err);
        res.status(500).json({ message: 'Server error updating job' });
    }
};

// ─── DELETE /api/recruiter/jobs/:id ───────────────────────────────────────────
exports.deleteJob = async (req, res) => {
    try {
        const job = await Job.findOneAndDelete({ _id: req.params.id, recruiter: req.recruiter._id });
        if (!job) return res.status(404).json({ message: 'Job not found or not authorized' });

        // Also delete related applications
        await Application.deleteMany({ job: req.params.id });

        res.status(200).json({ message: 'Job deleted successfully' });
    } catch (err) {
        console.error('deleteJob error:', err);
        res.status(500).json({ message: 'Server error deleting job' });
    }
};

// ─── GET /api/recruiter/jobs/:id/applicants ───────────────────────────────────
exports.getJobApplicants = async (req, res) => {
    try {
        const job = await Job.findOne({ _id: req.params.id, recruiter: req.recruiter._id });
        if (!job) return res.status(404).json({ message: 'Job not found or not authorized' });

        const applications = await Application.find({ job: req.params.id })
            .populate('candidate', 'fullName email scores verifiedSkills targetRole createdAt')
            .sort({ appliedAt: -1 })
            .lean();

        res.status(200).json({ applications });
    } catch (err) {
        console.error('getJobApplicants error:', err);
        res.status(500).json({ message: 'Server error fetching applicants' });
    }
};

// ─── GET /api/recruiter/applicants ────────────────────────────────────────────
exports.getAllApplicants = async (req, res) => {
    try {
        const jobIds = await Job.find({ recruiter: req.recruiter._id }, '_id').lean();
        const applications = await Application.find({ job: { $in: jobIds.map(j => j._id) } })
            .populate('candidate', 'fullName email scores verifiedSkills targetRole')
            .populate('job', 'title department')
            .sort({ appliedAt: -1 })
            .lean();

        res.status(200).json({ applications });
    } catch (err) {
        console.error('getAllApplicants error:', err);
        res.status(500).json({ message: 'Server error fetching applicants' });
    }
};
