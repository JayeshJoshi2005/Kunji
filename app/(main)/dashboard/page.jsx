import { Suspense } from "react";
import { getUserAccounts } from "@/actions/dashboard";
import { getDashboardData } from "@/actions/dashboard";
import { getCurrentBudget } from "@/actions/budget";
import { AccountCard } from "./_components/account-card";
import { CreateAccountDrawer } from "@/components/create-account-drawer";
import { BudgetProgress } from "./_components/budget-progress";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { DashboardOverview } from "./_components/transaction-overview";

export default async function DashboardPage() {
  const [accounts, transactions] = await Promise.all([
    getUserAccounts(),
    getDashboardData(),
  ]);

  const defaultAccount = accounts?.find((account) => account.isDefault);

  // Get budget for default account
  let budgetData = null;
  if (defaultAccount) {
    budgetData = await getCurrentBudget(defaultAccount.id);
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold gradient-title mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Manage your finances at a glance</p>
      </div>

      {/* Budget Progress */}
      <div className="rounded-xl border border-blue-200/50 bg-gradient-to-br from-blue-50/50 to-transparent p-6 shadow-sm">
        <BudgetProgress
          initialBudget={budgetData?.budget}
          currentExpenses={budgetData?.currentExpenses || 0}
        />
      </div>

      {/* Dashboard Overview */}
      <div className="rounded-xl border border-blue-200/50 bg-gradient-to-br from-blue-50/30 to-transparent p-6 shadow-sm">
        <DashboardOverview
          accounts={accounts}
          transactions={transactions || []}
        />
      </div>

      {/* Accounts Grid */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-foreground">Your Accounts</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <CreateAccountDrawer>
            <Card className="hover:shadow-lg transition-all duration-300 hover:border-blue-300 border-dashed hover:scale-105 cursor-pointer bg-gradient-to-br from-blue-50/50 to-transparent">
              <CardContent className="flex flex-col items-center justify-center text-muted-foreground h-full pt-5">
                <Plus className="h-10 w-10 mb-2 text-blue-500" />
                <p className="text-sm font-medium">Add New Account</p>
              </CardContent>
            </Card>
          </CreateAccountDrawer>
          {accounts.length > 0 &&
            accounts?.map((account) => (
              <AccountCard key={account.id} account={account} />
            ))}
        </div>
      </div>
    </div>
  );
}
