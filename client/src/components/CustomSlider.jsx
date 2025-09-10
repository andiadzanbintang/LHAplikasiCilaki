import { useState, useRef } from 'react';

const CustomSlider = ({ onChange }) => {
  const sliderRef = useRef(null);
  const [currentValue, setCurrentValue] = useState(1);
  const allowedValues = [-9, -8, -7, -6, -5, -4, -3, -2, 1, 2, 3, 4, 5, 6, 7, 8, 9];

  const getSliderPosition = (clientX) => {
    const rect = sliderRef.current.getBoundingClientRect();
    const position = clientX - rect.left;
    return Math.max(0, Math.min(rect.width, position));
  };

  const handleMouseMove = (event) => {
    const position = getSliderPosition(event.clientX);
    const index = Math.round((position / sliderRef.current.offsetWidth) * (allowedValues.length - 1));
    const newValue = allowedValues[index];
    setCurrentValue(newValue);
    onChange(newValue);
  };

  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  const handleMouseDown = (event) => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    handleMouseMove(event);
  };

  return (
    <div className="slider-container">
      <div className="scale-labels">
        {allowedValues.map((value) => (
          <span 
            key={value} 
            className="scale-label" 
            style={{ left: `${((allowedValues.indexOf(value) / (allowedValues.length - 1)) * 100)}%` }}
          >
            {Math.abs(value)} {/* Tampilkan nilai positif meski nilai aslinya negatif */}
          </span>
        ))}
      </div>
      <div
        ref={sliderRef}
        className="custom-slider-track"
        onMouseDown={handleMouseDown}
      >
        <div
          className="custom-slider-thumb"
          style={{ left: `${((allowedValues.indexOf(currentValue) / (allowedValues.length - 1)) * 100)}%` }}
        />
      </div>
    </div>
  );
};

export default CustomSlider;
