import React from "react";
import type { GradeEntry } from "../../types";
import { PASS_GRADE, requiredGrade } from "../../utils/grades";

/** "What do I still need?" — required average on the ungraded weight to pass. */
export function TargetHint({ grades }: { grades: GradeEntry[] }) {
  const pass = requiredGrade(grades, PASS_GRADE);
  if (!pass) return null;

  let text: React.ReactNode;
  if (pass.needed > 6) {
    text = (
      <>
        A {PASS_GRADE.toFixed(1)} is out of reach — it would take a {pass.needed.toFixed(2)} average
        on the remaining {pass.remaining}%.
      </>
    );
  } else if (pass.needed <= 1) {
    const five = requiredGrade(grades, 5);
    text = (
      <>
        Your pass is secured — even a 1.0 on the remaining {pass.remaining}% keeps you at{" "}
        {PASS_GRADE.toFixed(1)} or better.
        {five && five.needed > 1 && five.needed <= 6 && (
          <> For a 5.0 overall you'd need a {five.needed.toFixed(2)} average.</>
        )}
      </>
    );
  } else {
    text = (
      <>
        To pass with a {PASS_GRADE.toFixed(1)}, you need a {pass.needed.toFixed(2)} average on the
        remaining {pass.remaining}% of the weight.
      </>
    );
  }

  return (
    <p className="target-hint">
      <span>🎯</span>
      <span>{text}</span>
    </p>
  );
}
