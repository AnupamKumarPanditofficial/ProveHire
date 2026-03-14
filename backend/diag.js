const mongoose = require('mongoose');
const fs = require('fs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const Recruiter = require('./models/Recruiter');

const diag = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/test');
        console.log('--- DATABASE DIAGNOSTICS ---');
        console.log('Connected to:', mongoose.connection.name);

        const userCount = await User.countDocuments({});
        const recruiterCount = await Recruiter.countDocuments({});

        const allUsers = await User.find({}).lean();
        const allRecruiters = await Recruiter.find({}).lean();

        const results = {
            dbName: mongoose.connection.name,
            counts: { users: userCount, recruiters: recruiterCount },
            users: allUsers,
            recruiters: allRecruiters
        };

        fs.writeFileSync(path.join(__dirname, 'diag_results.json'), JSON.stringify(results, null, 2));
        console.log('Results saved to diag_results.json');
        process.exit(0);
    } catch (err) {
        console.error('Diag Error:', err);
        process.exit(1);
    }
};

diag();
