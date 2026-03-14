import './Stats.css';

const Stats = () => {
    return (
        <section className="stats-section">
            <div className="container stats-container">

                <div className="stats-grid glass-panel">
                    <div className="stat-item">
                        <h2 className="stat-number">10,000+</h2>
                        <p className="stat-label">Jobs Posted</p>
                    </div>

                    <div className="stat-divider"></div>

                    <div className="stat-item">
                        <h2 className="stat-number">50,000+</h2>
                        <p className="stat-label">Active Candidates</p>
                    </div>

                    <div className="stat-divider"></div>

                    <div className="stat-item">
                        <h2 className="stat-number highlight-number">95%</h2>
                        <p className="stat-label">Placement Success Rate</p>
                    </div>
                </div>

            </div>
        </section>
    );
};

export default Stats;
