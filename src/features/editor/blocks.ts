import type { Block, BlockType } from "../../types";
import { uid } from "../../utils/id";

export function createBlock(type: BlockType = "text"): Block {
  return { id: uid(), type, text: "" };
}
