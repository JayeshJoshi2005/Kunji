import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "Kunji",
  name: "Kunji",
  eventKey: process.env.INNGEST_EVENT_KEY,
  signingKey: process.env.INNGEST_SIGNING_KEY || process.env.INNGEST_BASE_URL, // Support both naming conventions
  retryFunction: async (attempt) => ({
    delay: Math.pow(2, attempt) * 1000,
    maxAttempts: 2,
  }),
});