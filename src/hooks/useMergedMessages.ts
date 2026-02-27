import { useMemo } from "react";
import { mergeMessages } from "../lib/mergeMessages";
import type { Message, MergedMessage } from "../types";

export function useMergedMessages(messages: Message[]): MergedMessage[] {
  return useMemo(() => mergeMessages(messages), [messages]);
}
