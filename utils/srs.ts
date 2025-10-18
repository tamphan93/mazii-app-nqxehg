
import { ReviewGrade } from '@/types/dictionary';

export interface SRSResult {
  interval: number;
  ease: number;
  dueAt: string;
  repetitions: number;
}

export const calculateSRS = (
  grade: ReviewGrade,
  currentInterval: number,
  currentEase: number,
  currentRepetitions: number
): SRSResult => {
  let interval = currentInterval;
  let ease = currentEase;
  let repetitions = currentRepetitions;

  if (grade === 'again') {
    interval = 1;
    repetitions = 0;
    ease = Math.max(130, ease - 20);
  } else {
    repetitions += 1;
    
    // Calculate ease factor change
    let gradeValue = 0;
    switch (grade) {
      case 'hard':
        gradeValue = 2;
        break;
      case 'good':
        gradeValue = 3;
        break;
      case 'easy':
        gradeValue = 4;
        break;
    }
    
    const easeChange = (0.1 - (5 - gradeValue) * (0.08 + (5 - gradeValue) * 0.02)) * 100;
    ease = Math.max(130, ease + easeChange);
    
    // Calculate new interval
    if (repetitions === 1) {
      interval = grade === 'easy' ? 4 : grade === 'good' ? 1 : 1;
    } else if (repetitions === 2) {
      interval = grade === 'easy' ? 6 : grade === 'good' ? 6 : 3;
    } else {
      const multiplier = ease / 250;
      interval = Math.round(interval * multiplier);
      
      if (grade === 'hard') {
        interval = Math.round(interval * 0.8);
      } else if (grade === 'easy') {
        interval = Math.round(interval * 1.3);
      }
    }
  }

  // Calculate due date
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + interval);
  const dueAt = dueDate.toISOString();

  return {
    interval,
    ease: Math.round(ease),
    dueAt,
    repetitions,
  };
};
