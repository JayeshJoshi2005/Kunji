import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "Kunji",
  name: "Kunji",
  eventKey: process.env.INNGEST_EVENT_KEY,
  retryFunction: async (attempt) => ({
    delay: Math.pow(2, attempt) * 1000,
    maxAttempts: 2,
  }),
});