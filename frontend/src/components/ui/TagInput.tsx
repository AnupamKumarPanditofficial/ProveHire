import React, { useState, useRef, KeyboardEvent } from 'react';
import './TagInputAndSlider.css';

interface TagInputProps {
    tags: string[];
    onChange: (tags: string[]) => void;
    placeholder?: string;
    error?: boolean;
}

const TagInput: React.FC<TagInputProps> = ({ tags, onChange, placeholder = 'Add more...', error }) => {
    const [input, setInput] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const addTag = (val: string) => {
        const trimmed = val.trim();
        if (trimmed && !tags.includes(trimmed)) {
            onChange([...tags, trimmed]);
        }
        setInput('');
    };

    const removeTag = (idx: number) => {
        onChange(tags.filter((_, i) => i !== idx));
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag(input);
        } else if (e.key === 'Backspace' && !input && tags.length > 0) {
            onChange(tags.slice(0, -1));
        }
    };

    return (
        <div
            className={`tag-input-wrapper${error ? ' error' : ''}`}
            onClick={() => inputRef.current?.focus()}
        >
            {tags.map((tag, i) => (
                <span key={i} className="tag-chip">
                    {tag}
                    <button className="tag-chip-remove" onClick={() => removeTag(i)} title={`Remove ${tag}`}>×</button>
                </span>
            ))}
            <input
                ref={inputRef}
                className="tag-text-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => { if (input.trim()) addTag(input); }}
                placeholder={tags.length === 0 ? 'e.g. React, TypeScript...' : placeholder}
            />
        </div>
    );
};

export default TagInput;
