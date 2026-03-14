import { Check, X } from 'lucide-react';
import './PasswordChecklist.css';

interface PasswordChecklistProps {
    password: string;
    visible: boolean;
}

export const PasswordChecklist = ({ password, visible }: PasswordChecklistProps) => {
    if (!visible) return null;

    const rules = [
        { label: '8+ characters', test: (p: string) => p.length >= 8 },
        { label: 'Uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
        { label: 'Lowercase letter', test: (p: string) => /[a-z]/.test(p) },
        { label: 'Digit', test: (p: string) => /\d/.test(p) },
        { label: 'Symbol (@$!%*?&)', test: (p: string) => /[@$!%*?&]/.test(p) },
    ];

    return (
        <div className="password-checklist">
            {rules.map((rule, idx) => {
                const isValid = rule.test(password);
                return (
                    <div key={idx} className={`checklist-item ${isValid ? 'valid' : 'invalid'}`}>
                        {isValid ? <Check size={14} className="icon check-icon" /> : <X size={14} className="icon x-icon" />}
                        <span>{rule.label}</span>
                    </div>
                );
            })}
        </div>
    );
};

export const isPasswordValidComplete = (password: string) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password);
};
