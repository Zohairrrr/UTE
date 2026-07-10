import { logUnexpected } from "@/lib/app-log";
import fs from "fs";
import path from "path";

export type ActionState = {
  ok: boolean;
  message: string;
};

export class PublicActionError extends Error {}

export async function safeAction<T extends ActionState = ActionState>(
  scope: string,
  action: string,
  work: () => Promise<T>,
  fallback = "Something went wrong. Try again."
): Promise<T | ActionState> {
  try {
    return await work();
  } catch (error) {
    try {
      const logPath = path.join(process.cwd(), "error.log");
      const logText = `\n--- ERROR [${scope}:${action}] at ${new Date().toISOString()} ---\n${
        error instanceof Error ? error.stack : String(error)
      }\n-----------------------------------------\n`;
      fs.appendFileSync(logPath, logText);
    } catch (e) {
      console.error("Failed to write to error.log:", e);
    }

    if (error instanceof PublicActionError) {
      return { ok: false, message: error.message };
    }
    await logUnexpected(scope, action, error);
    return { ok: false, message: fallback };
  }
}
