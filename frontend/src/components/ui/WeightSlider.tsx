import React from 'react';
import './TagInputAndSlider.css';

interface WeightSliderProps {
    label: string;
    value: number;
    description: string;
    onChange: (val: number) => void;
}

const WeightSlider: React.FC<WeightSliderProps> = ({ label, value, description, onChange }) => {
    return (
        <div className="weight-slider-row">
            <div className="weight-slider-header">
                <span className="weight-slider-label">{label}</span>
                <span className="weight-slider-pct">{value}%</span>
            </div>
            <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={value}
                onChange={e => onChange(parseInt(e.target.value))}
                className="weight-slider-input"
            />
            <p className="weight-slider-desc">{description}</p>
        </div>
    );
};

export default WeightSlider;
