import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import './FilterDropdown.css';

interface FilterDropdownProps {
    label: string;
    value: string;
    options: string[];
    onChange: (v: string) => void;
    /** Show the pill as active/highlighted */
    active?: boolean;
    icon?: React.ReactNode;
}

const FilterDropdown = ({ label, value, options, onChange, active = false, icon }: FilterDropdownProps) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const displayLabel = value === 'All' ? label : `${label}: ${value}`;
    const isFiltered = value !== 'All';

    return (
        <div className={`fd-wrap ${active ? 'fd-active' : ''} ${isFiltered ? 'fd-filtered' : ''}`} ref={ref}>
            <button
                className="fd-chip"
                onClick={() => setOpen(o => !o)}
                aria-expanded={open}
            >
                {icon && <span className="fd-icon">{icon}</span>}
                <span>{displayLabel}</span>
                <ChevronDown size={12} className={`fd-chevron ${open ? 'open' : ''}`} />
            </button>

            {open && (
                <div className="fd-menu">
                    {options.map(opt => (
                        <button
                            key={opt}
                            className={`fd-option ${value === opt ? 'selected' : ''}`}
                            onClick={() => { onChange(opt); setOpen(false); }}
                        >
                            <span>{opt}</span>
                            {value === opt && <Check size={13} className="fd-check" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FilterDropdown;
