import { Monitor, Server, Layers as LayersIcon, Coffee, BookOpen, Code2, BrainCircuit, BarChart3, Globe } from 'lucide-react';

export interface CareerPath {
    id: string;
    icon: React.ReactNode;
    title: string;
    desc: string;
    color: string;
    glow: string;
}

export const CAREERS: CareerPath[] = [
    {
        id: 'frontend', icon: <Monitor size={30} />, title: 'Frontend Developer',
        desc: 'React, Vue, Angular & modern UI engineering',
        color: '#3b82f6', glow: 'rgba(59,130,246,0.35)',
    },
    {
        id: 'backend', icon: <Server size={30} />, title: 'Backend Developer',
        desc: 'Node.js, APIs, databases & server architecture',
        color: '#8b5cf6', glow: 'rgba(139,92,246,0.35)',
    },
    {
        id: 'fullstack', icon: <LayersIcon size={30} />, title: 'Full Stack Developer',
        desc: 'End-to-end product development, frontend & backend',
        color: '#6366f1', glow: 'rgba(99,102,241,0.35)',
    },
    {
        id: 'python', icon: <Coffee size={30} />, title: 'Python Developer',
        desc: 'Django, FastAPI, scripting & automation',
        color: '#f59e0b', glow: 'rgba(245,158,11,0.35)',
    },
    {
        id: 'java', icon: <BookOpen size={30} />, title: 'Java Developer',
        desc: 'Spring Boot, microservices & enterprise apps',
        color: '#ef4444', glow: 'rgba(239,68,68,0.35)',
    },
    {
        id: 'sde', icon: <Code2 size={30} />, title: 'Software Engineer',
        desc: 'Systems, algorithms & cross-platform development',
        color: '#06b6d4', glow: 'rgba(6,182,212,0.35)',
    },
    {
        id: 'ml', icon: <BrainCircuit size={30} />, title: 'ML / AI Engineer',
        desc: 'Deep learning, MLOps & model deployment',
        color: '#8b5cf6', glow: 'rgba(139,92,246,0.35)',
    },
    {
        id: 'da', icon: <BarChart3 size={30} />, title: 'Data Analyst',
        desc: 'SQL, Tableau, Power BI & business intelligence',
        color: '#10b981', glow: 'rgba(16,185,129,0.35)',
    },
    {
        id: 'devops', icon: <Globe size={30} />, title: 'DevOps Engineer',
        desc: 'CI/CD, Docker, Kubernetes & cloud infrastructure',
        color: '#f97316', glow: 'rgba(249,115,22,0.35)',
    },
];
