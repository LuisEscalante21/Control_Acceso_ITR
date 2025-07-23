import React, { useEffect, useState } from 'react';
import '../../styles/SchoolYearProgress.css';

const SchoolYearProgress = () => {
  const [progress, setProgress] = useState(0);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    calculateSchoolYearProgress();
  }, []);

  const calculateSchoolYearProgress = () => {
    const year = new Date().getFullYear();
    const start = new Date(`${year}-01-20`);
    const end = new Date(`${year}-10-20`);
    const today = new Date();

    if (today < start) {
      setProgress(0);
      return;
    }

    if (today > end) {
      setProgress(100);
      return;
    }

    const totalDuration = end - start;
    const elapsed = today - start;
    const percentage = (elapsed / totalDuration) * 100;
    setProgress(Math.floor(percentage));
  };

  return (
    <div className="widget-progress">
      <div
        className="progress-circle"
        style={{ '--progress': progress }}
      >
        <div className="progress-fill">{progress}%</div>
      </div>
      <p>Progreso de año electivo {currentYear}</p>
    </div>
  );
};

export default SchoolYearProgress;
