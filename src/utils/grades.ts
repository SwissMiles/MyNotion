import type { Course, GradeEntry } from "../types";

/**
 * Swiss grading: 1.0 (worst) … 6.0 (best), 4.0 and above is a pass.
 */

export const PASS_GRADE = 4.0;

/**
 * Weighted course average on the 1–6 scale, or null when no grades entered.
 * Weights are normalized over the entered entries so a partially-graded
 * course still shows a meaningful "current standing".
 */
export function courseGrade(grades: GradeEntry[]): number | null {
  const valid = grades.filter((g) => g.weight > 0 && g.grade >= 1 && g.grade <= 6);
  if (valid.length === 0) return null;
  const totalWeight = valid.reduce((sum, g) => sum + g.weight, 0);
  const weighted = valid.reduce((sum, g) => sum + g.grade * g.weight, 0);
  return weighted / totalWeight;
}

/** Official course grade, rounded to the nearest quarter grade (ETH-style). */
export function roundToQuarter(grade: number): number {
  return Math.round(grade * 4) / 4;
}

export function isPass(grade: number): boolean {
  return roundToQuarter(grade) >= PASS_GRADE;
}

/** Standard Swiss points-to-grade formula: 5 · points/max + 1. */
export function pointsToGrade(score: number, outOf: number): number {
  if (outOf <= 0) return 1;
  return Math.min(6, Math.max(1, 5 * (score / outOf) + 1));
}

export function fmtGrade(grade: number): string {
  // quarter grades print naturally: 4.5, 5.25 — otherwise two decimals
  const rounded = Math.round(grade * 100) / 100;
  return String(Number.isInteger(rounded * 4) ? rounded * 4 / 4 : rounded.toFixed(2));
}

/** Credit-weighted semester average (1–6) across courses that have any grades. */
export function semesterAverage(courses: Course[], grades: GradeEntry[]): number | null {
  let creditSum = 0;
  let gradeSum = 0;
  for (const course of courses) {
    const avg = courseGrade(grades.filter((g) => g.courseId === course.id));
    if (avg === null) continue;
    const credits = course.credits > 0 ? course.credits : 1;
    creditSum += credits;
    gradeSum += roundToQuarter(avg) * credits;
  }
  return creditSum > 0 ? gradeSum / creditSum : null;
}
