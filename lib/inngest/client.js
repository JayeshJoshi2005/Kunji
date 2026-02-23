import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "Kunji", // Unique app ID
  name: "Kunji",
  eventKey: process.env.INNGEST_EVENT_KEY,
  baseUrl: process.env.INNGEST_BASE_URL,
  retryFunction: async (attempt) => ({
    delay: Math.pow(2, attempt) * 1000, // Exponential backoff
    maxAttempts: 2,
  }),
});
