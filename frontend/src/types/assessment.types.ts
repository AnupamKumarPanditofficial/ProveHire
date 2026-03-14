export type Difficulty = 'easy' | 'medium' | 'hard';
export type QuestionType = 'theory' | 'code';
export type ViolationType =
    | 'TAB_SWITCH'
    | 'WINDOW_BLUR'
    | 'FULLSCREEN_EXIT'
    | 'COPY_ATTEMPT'
    | 'RIGHT_CLICK'
    | 'KEYBOARD_SHORTCUT'
    | 'NO_FACE'
    | 'MULTIPLE_FACES'
    | 'LOOKING_AWAY'
    | 'NOISE_DETECTED';

export interface Question {
    id: string;
    type: QuestionType;
    question: string;
    code?: string | null;
    language?: string | null;
    options: string[];
    correctIndex: number;
    topic: string;
    difficulty: Difficulty;
    explanation: string;
}

export interface Violation {
    type: ViolationType;
    timestamp: Date;
    questionIndex: number;
    details: string;
}

export interface AssessmentState {
    questions: Question[];
    currentIndex: number;
    answers: Map<number, number>; // questionIndex -> optionIndex
    markedForReview: Set<number>;
    questionTimer: number; // counts down from 40
    totalTimeElapsed: number; // counts up
    violations: Violation[];
    warningCount: number;
    status: 'loading' | 'active' | 'warning' | 'submitted';
    isFullscreen: boolean;
}

export interface TopicPerformance {
    topic: string;
    correct: number;
    total: number;
    percentage: number;
    status: 'Strong' | 'Average' | 'Weak';
}

export interface AssessmentResult {
    testScore: number;
    grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
    passed: boolean;
    topicWise: TopicPerformance[];
    strengths: string[];
    weaknesses: string[];
    recommendation: 'Hire' | 'Maybe' | 'Reject';
    aiVerdict: string;
    studyPlan: string[];
    integrityScore: number;
    totalViolations: number;
}
