import React from "react";
import { ColorDot } from "../../components/ColorDot";
import { Highlight } from "./Highlight";
import type { QuickFindResult, ResultTag } from "./types";

export function ResultItem({
  result,
  index,
  selected,
  onHover,
  onRun,
}: {
  result: QuickFindResult;
  index: number;
  selected: boolean;
  onHover: () => void;
  onRun: () => void;
}) {
  return (
    <button
      data-idx={index}
      className={`qf-item ${selected ? "selected" : ""}`}
      onMouseEnter={onHover}
      onClick={onRun}
    >
      <span className="qf-icon">{result.icon}</span>
      <span className="qf-main">
        <span className="qf-title">
          <Highlight text={result.title} ranges={result.titleRanges} />
        </span>
        {result.snippet && (
          <span className="qf-snippet">
            <Highlight text={result.snippet.text} ranges={result.snippet.ranges} />
          </span>
        )}
      </span>
      {result.tags && result.tags.length > 0 && <ResultTags tags={result.tags} />}
    </button>
  );
}

function ResultTags({ tags }: { tags: ResultTag[] }) {
  const visible = tags.filter((tag) => tag.label || tag.color);
  return (
    <span className="qf-tags">
      {visible.map((tag, i) =>
        tag.color && !tag.label ? (
          <ColorDot key={i} color={tag.color} />
        ) : (
          <span key={i} className={`pill ${tag.tone ?? ""}`}>
            {tag.color && <ColorDot color={tag.color} size="sm" />}
            {tag.label}
          </span>
        ),
      )}
    </span>
  );
}
