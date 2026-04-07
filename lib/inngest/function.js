import { inngest } from "./client";
import { db } from "@/lib/prisma";
import EmailTemplate from "@/emails/template";
import { sendEmail } from "@/actions/send-email";
import { GoogleGenerativeAI } from "@google/generative-ai";

// 1. Recurring Transaction Processing with Throttling
export const processRecurringTransaction = inngest.createFunction(
  {
    id: "process-recurring-transaction",
    name: "Process Recurring Transaction",
    throttle: {
      limit: 10, // Process 10 transactions
      period: "1m", // per minute
      key: "event.data.userId", // Throttle per user
    },
  },
  { event: "transaction.recurring.process" },
  async ({ event, step }) => {
    // Validate event data
    if (!event?.data?.transactionId || !event?.data?.userId) {
      console.error("Invalid event data:", event);
      return { error: "Missing required event data" };
    }

    console.log(
      `[processRecurringTransaction] Processing transaction ${event.data.transactionId} for user ${event.data.userId}`
    );

    await step.run("process-transaction", async () => {
      const transaction = await db.transaction.findUnique({
        where: {
          id: event.data.transactionId,
        },
        include: {
          account: true,
        },
      });

      if (!transaction) {
        console.error(
          `[processRecurringTransaction] Transaction ${event.data.transactionId} not found`
        );
        return;
      }

      console.log(
        `[processRecurringTransaction] Found transaction: ${transaction.description}, isDue: ${isTransactionDue(
          transaction
        )}`
      );

      if (!transaction || !isTransactionDue(transaction)) {
        console.log(
          `[processRecurringTransaction] Transaction is not due yet`
        );
        return;
      }
      if (!transaction.recurringInterval) {
        console.log(
          `[processRecurringTransaction] Transaction has no recurring interval`
        );
        return;
      }

      const now = new Date();
      let nextDueDate = transaction.nextRecurringDate
        ? new Date(transaction.nextRecurringDate)
        : transaction.date
        ? calculateNextRecurringDate(new Date(transaction.date), transaction.recurringInterval)
        : now;

      const dueDates = [];
      const maxCyclesMap = {
        DAILY: 30,
        WEEKLY: 12,
        MONTHLY: 12,
        YEARLY: 5,
      };
      const maxCycles =
        maxCyclesMap[transaction.recurringInterval] !== undefined
          ? maxCyclesMap[transaction.recurringInterval]
          : 30;
      let cycles = 0;

      while (nextDueDate <= now && cycles < maxCycles) {
        dueDates.push(new Date(nextDueDate));
        nextDueDate = calculateNextRecurringDate(
          nextDueDate,
          transaction.recurringInterval
        );
        cycles += 1;
      }

      console.log(
        `[processRecurringTransaction] Found ${dueDates.length} due dates to process`
      );

      if (dueDates.length === 0) return;

      await db.$transaction(async (tx) => {
        for (const dueDate of dueDates) {
          console.log(
            `[processRecurringTransaction] Creating transaction for date ${dueDate.toISOString()}`
          );
          await tx.transaction.create({
            data: {
              type: transaction.type,
              amount: transaction.amount,
              description: `${transaction.description} (Recurring)`,
              date: new Date(dueDate),
              category: transaction.category,
              userId: transaction.userId,
              accountId: transaction.accountId,
              isRecurring: false,
              status: "COMPLETED",
            },
          });

          const balanceChange =
            transaction.type === "EXPENSE"
              ? -transaction.amount.toNumber()
              : transaction.amount.toNumber();

          await tx.account.update({
            where: { id: transaction.accountId },
            data: { balance: { increment: balanceChange } },
          });
        }

        console.log(
          `[processRecurringTransaction] Updating nextRecurringDate to ${nextDueDate.toISOString()}`
        );
        await tx.transaction.update({
          where: { id: transaction.id },
          data: {
            lastProcessed: now,
            nextRecurringDate: nextDueDate,
          },
        });
      });

      console.log(
        `[processRecurringTransaction] Successfully processed ${dueDates.length} recurring instances`
      );
    });
  }
);

// Trigger recurring transactions with batching
export const triggerRecurringTransactions = inngest.createFunction(
  {
    id: "trigger-recurring-transactions", // Unique ID,
    name: "Trigger Recurring Transactions",
  },
  { cron: "0 0 * * *" }, // Daily at midnight
  async ({ step }) => {
    const now = new Date();
    console.log(
      `[trigger-recurring-transactions] Running at ${now.toISOString()}`
    );

    const recurringTransactions = await step.run(
      "fetch-recurring-transactions",
      async () => {
        const results = await db.transaction.findMany({
          where: {
            isRecurring: true,
            status: "COMPLETED",
            recurringInterval: {
              not: null,
            },
          },
        });

        console.log(
          `[trigger-recurring-transactions] Found ${results.length} recurring transactions`
        );

        // Filter those that are due
        const dueTx = results.filter((tx) => {
          const isDue = isTransactionDue(tx);
          if (isDue) {
            console.log(
              `[trigger-recurring-transactions] Transaction ${tx.id} is due. nextRecurringDate: ${tx.nextRecurringDate}, lastProcessed: ${tx.lastProcessed}`
            );
          }
          return isDue;
        });

        console.log(
          `[trigger-recurring-transactions] ${dueTx.length} transactions are due`
        );
        return dueTx;
      }
    );

    // Batch send events for performance (still a reliable retry path in Inngest)
    if (recurringTransactions.length > 0) {
      console.log(
        `[trigger-recurring-transactions] Sending ${recurringTransactions.length} events`
      );
      const events = recurringTransactions.map((transaction) => ({
        name: "transaction.recurring.process",
        data: {
          transactionId: transaction.id,
          userId: transaction.userId,
        },
      }));

      await inngest.send(events);
      return { triggered: recurringTransactions.length, success: true };
    }

    console.log(
      `[trigger-recurring-transactions] No recurring transactions to process`
    );
    return { triggered: 0, success: true };
  }
);

// 2. Monthly Report Generation
async function generateFinancialInsights(stats, month) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

  const prompt = `
    Analyze this financial data and provide 3 concise, actionable insights.
    Focus on spending patterns and practical advice.
    Keep it friendly and conversational.

    Financial Data for ${month}:
    - Total Income: ₹${stats.totalIncome}
    - Total Expenses: ₹${stats.totalExpenses}
    - Net Income: ₹${stats.totalIncome - stats.totalExpenses}
    - Expense Categories: ${Object.entries(stats.byCategory)
      .map(([category, amount]) => `${category}: ₹${amount}`)
      .join(", ")}

    Format the response as a JSON array of strings, like this:
    ["insight 1", "insight 2", "insight 3"]
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Error generating insights:", error);
    return [
      "Your highest expense category this month might need attention.",
      "Consider setting up a budget for better financial management.",
      "Track your recurring expenses to identify potential savings.",
    ];
  }
}

export const generateMonthlyReports = inngest.createFunction(
  {
    id: "generate-monthly-reports",
    name: "Generate Monthly Reports",
  },
  { cron: "0 0 1 * *" }, // First day of each month
  async ({ step }) => {
    const users = await step.run("fetch-users", async () => {
      return await db.user.findMany({
        include: { accounts: true },
      });
    });

    for (const user of users) {
      await step.run(`generate-report-${user.id}`, async () => {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        const stats = await getMonthlyStats(user.id, lastMonth);
        const monthName = lastMonth.toLocaleString("default", {
          month: "long",
        });

        // Generate AI insights
        const insights = await generateFinancialInsights(stats, monthName);

        await sendEmail({
          to: user.email,
          subject: `Your Monthly Financial Report - ${monthName}`,
          react: EmailTemplate({
            userName: user.name,
            type: "monthly-report",
            data: {
              stats,
              month: monthName,
              insights,
            },
          }),
        });
      });
    }

    return { processed: users.length };
  }
);

// 3. Budget Alerts with Event Batching
export const checkBudgetAlerts = inngest.createFunction(
  { name: "Check Budget Alerts" },
  { cron: "0 */6 * * *" }, // Every 6 hours
  async ({ step }) => {
    const budgets = await step.run("fetch-budgets", async () => {
      return await db.budget.findMany({
        include: {
          user: {
            include: {
              accounts: {
                where: {
                  isDefault: true,
                },
              },
            },
          },
        },
      });
    });

    for (const budget of budgets) {
      const defaultAccount = budget.user.accounts[0];
      if (!defaultAccount) continue; // Skip if no default account

      await step.run(`check-budget-${budget.id}`, async () => {
        const startDate = new Date();
        startDate.setDate(1); // Start of current month

        // Calculate total expenses for the default account only
        const expenses = await db.transaction.aggregate({
          where: {
            userId: budget.userId,
            accountId: defaultAccount.id, // Only consider default account
            type: "EXPENSE",
            date: {
              gte: startDate,
            },
          },
          _sum: {
            amount: true,
          },
        });

        const totalExpenses = expenses._sum.amount?.toNumber() || 0;
        const budgetAmount = budget.amount;
        const percentageUsed = (totalExpenses / budgetAmount) * 100;

        // Check if we should send an alert
        if (
          percentageUsed >= 80 && // Default threshold of 80%
          (!budget.lastAlertSent ||
            isNewMonth(new Date(budget.lastAlertSent), new Date()))
        ) {
          await sendEmail({
            to: budget.user.email,
            subject: `Budget Alert for ${defaultAccount.name}`,
            react: EmailTemplate({
              userName: budget.user.name,
              type: "budget-alert",
              data: {
                percentageUsed,
                budgetAmount: parseInt(budgetAmount).toFixed(1),
                totalExpenses: parseInt(totalExpenses).toFixed(1),
                accountName: defaultAccount.name,
              },
            }),
          });

          // Update last alert sent
          await db.budget.update({
            where: { id: budget.id },
            data: { lastAlertSent: new Date() },
          });
        }
      });
    }
  }
);

function isNewMonth(lastAlertDate, currentDate) {
  return (
    lastAlertDate.getMonth() !== currentDate.getMonth() ||
    lastAlertDate.getFullYear() !== currentDate.getFullYear()
  );
}

// Utility functions
function normalizeDate(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isTransactionDue(transaction) {
  const today = normalizeDate(new Date());

  if (transaction.nextRecurringDate) {
    const nextDue = normalizeDate(new Date(transaction.nextRecurringDate));
    return nextDue <= today;
  }

  if (!transaction.lastProcessed) {
    return true;
  }

  return false;
}

function calculateNextRecurringDate(date, interval) {
  const next = new Date(date);
  switch (interval) {
    case "DAILY":
      next.setDate(next.getDate() + 1);
      break;
    case "WEEKLY":
      next.setDate(next.getDate() + 7);
      break;
    case "MONTHLY":
      next.setMonth(next.getMonth() + 1);
      break;
    case "YEARLY":
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
}

async function getMonthlyStats(userId, month) {
  const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
  const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);

  const transactions = await db.transaction.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  return transactions.reduce(
    (stats, t) => {
      const amount = t.amount.toNumber();
      if (t.type === "EXPENSE") {
        stats.totalExpenses += amount;
        stats.byCategory[t.category] =
          (stats.byCategory[t.category] || 0) + amount;
      } else {
        stats.totalIncome += amount;
      }
      return stats;
    },
    {
      totalExpenses: 0,
      totalIncome: 0,
      byCategory: {},
      transactionCount: transactions.length,
    }
  );
}
