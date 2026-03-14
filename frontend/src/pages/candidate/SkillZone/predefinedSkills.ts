import type { RecommendedSkill } from '../../../services/geminiAssessment';

export const ROLE_SKILLS_MAP: Record<string, RecommendedSkill[]> = {
    'Frontend Developer': [
        { name: 'JavaScript / TypeScript', importance: 'Core language for frontend development.', icon: '⚡' },
        { name: 'React', importance: 'Industry standard library for building user interfaces.', icon: '⚛️' },
        { name: 'CSS / Styling', importance: 'Fundamental for responsive and accessible web design.', icon: '🎨' },
        { name: 'State Management', importance: 'Crucial for handling complex data flows (Redux, Zustand, Context).', icon: '📦' },
        { name: 'Web Performance', importance: 'Critical for optimizing load times and core web vitals.', icon: '🚀' }
    ],
    'Backend Developer': [
        { name: 'Node.js', importance: 'Core runtime environment for scalable backend services.', icon: '🟢' },
        { name: 'API Design', importance: 'Essential for building robust REST and GraphQL endpoints.', icon: '🔌' },
        { name: 'Database Management', importance: 'Critical for data persistence, schema design, and querying (SQL/NoSQL).', icon: '🗄️' },
        { name: 'System Architecture', importance: 'Fundamental for designing distributed and microservices systems.', icon: '🏗️' },
        { name: 'Security & Auth', importance: 'Vital for protecting data and handling JWT, OAuth, and sessions.', icon: '🔒' }
    ],
    'Full Stack Developer': [
        { name: 'React', importance: 'Industry standard library for frontend UI development.', icon: '⚛️' },
        { name: 'Node.js', importance: 'Core runtime environment for scalable backend services.', icon: '🟢' },
        { name: 'Database Management', importance: 'Critical for data persistence and querying (SQL/NoSQL).', icon: '🗄️' },
        { name: 'API Design', importance: 'Essential for building robust REST and GraphQL endpoints.', icon: '🔌' },
        { name: 'System Architecture', importance: 'Fundamental for designing full end-to-end scalable applications.', icon: '🏗️' }
    ],
    'Python Developer': [
        { name: 'Python Core', importance: 'Deep understanding of Python language features and idioms.', icon: '🐍' },
        { name: 'Django / FastAPI', importance: 'Key frameworks for building rapid and high-performance web APIs.', icon: '🚀' },
        { name: 'Data Structures', importance: 'Fundamental for optimizing application performance and algorithms.', icon: '📚' },
        { name: 'Database Integrations', importance: 'Essential for utilizing ORMs and executing complex queries.', icon: '🗄️' },
        { name: 'Testing & Automation', importance: 'Critical for maintaining reliable codebases and CI/CD pipelines.', icon: '⚙️' }
    ],
    'Java Developer': [
        { name: 'Java Core', importance: 'Mastery of OOP, concurrency, and Java internals.', icon: '☕' },
        { name: 'Spring Boot', importance: 'Industry standard framework for enterprise Java applications.', icon: '🍃' },
        { name: 'Microservices architecture', importance: 'Fundamental for designing decoupled, scalable enterprise systems.', icon: '🧩' },
        { name: 'Database Management', importance: 'Critical for JPA, Hibernate, and SQL optimizations.', icon: '🗄️' },
        { name: 'Unit Testing', importance: 'Essential for robust application quality using JUnit and Mockito.', icon: '✅' }
    ],
    'Software Engineer': [
        { name: 'Data Structures & Algorithms', importance: 'Core foundation for solving complex computational problems.', icon: '🧠' },
        { name: 'System Design', importance: 'Critical for architecting scalable and fault-tolerant systems.', icon: '🏗️' },
        { name: 'Object-Oriented Programming', importance: 'Fundamental paradigm for structuring maintainable code.', icon: '📦' },
        { name: 'Database Concepts', importance: 'Essential understanding of ACID, normalization, and indexing.', icon: '🗄️' },
        { name: 'Version Control & CI/CD', importance: 'Vital for team collaboration and automated deployments.', icon: '🔄' }
    ],
    'ML / AI Engineer': [
        { name: 'Python Machine Learning', importance: 'Core language and libraries (Pandas, Numpy, Scikit-learn).', icon: '🐍' },
        { name: 'Deep Learning', importance: 'Crucial for neural networks, NLP, or computer vision (PyTorch/TensorFlow).', icon: '🧠' },
        { name: 'Data Processing Pipelines', importance: 'Essential for cleaning and preparing large datasets for modeling.', icon: '📊' },
        { name: 'Mathematics & Statistics', importance: 'Fundamental theory underlying algorithms and model evaluation.', icon: '📐' },
        { name: 'MLOps', importance: 'Critical for deploying and monitoring models in production environments.', icon: '⚙️' }
    ],
    'Data Analyst': [
        { name: 'SQL querying', importance: 'Core skill for extracting and manipulating data from relational databases.', icon: '🗄️' },
        { name: 'Data Visualization', importance: 'Crucial for communicating insights using tools like Tableau or PowerBI.', icon: '📈' },
        { name: 'Python / R', importance: 'Essential for statistical computing and advanced data manipulation.', icon: '🐍' },
        { name: 'Statistical Analysis', importance: 'Fundamental for A/B testing, hypothesis testing, and trend analysis.', icon: '📊' },
        { name: 'Data Cleaning', importance: 'Critical for ensuring data quality before analysis.', icon: '🧹' }
    ],
    'DevOps Engineer': [
        { name: 'CI/CD Pipelines', importance: 'Core for automating testing and deployment processes.', icon: '🔄' },
        { name: 'Docker & Kubernetes', importance: 'Essential for container orchestration and scalable deployments.', icon: '🐳' },
        { name: 'Cloud Infrastructure', importance: 'Crucial understanding of AWS, GCP, or Azure environments.', icon: '☁️' },
        { name: 'Infrastructure as Code', importance: 'Fundamental for provisioning resources (Terraform, CloudFormation).', icon: '🏗️' },
        { name: 'Linux Administration', importance: 'Critical for managing servers, networking, and scripting.', icon: '🐧' }
    ]
};

// Generic fallback if role doesn't strictly match
export const FALLBACK_SKILLS: RecommendedSkill[] = [
    { name: 'Problem Solving', importance: 'General analytical and algorithmic thinking.', icon: '🧠' },
    { name: 'Programming Fundamentals', importance: 'Core concepts applicable across languages.', icon: '💻' },
    { name: 'System Design', importance: 'Understanding of architecture and scalability.', icon: '🏗️' },
    { name: 'Databases', importance: 'General data storage and retrieval knowledge.', icon: '🗄️' },
    { name: 'Version Control', importance: 'Code management and collaboration.', icon: '🔄' }
];
