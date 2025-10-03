import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, CreditCard, Activity } from "lucide-react";

const stats = [
  {
    title: "Earnings",
    value: "$350.4",
    description: "Total Spent",
    icon: DollarSign,
  },
  {
    title: "Spend this month",
    value: "$642.39",
    description: "+2.45% from last month",
    icon: CreditCard,
  },
  {
    title: "Sales",
    value: "$574.34",
    description: "+1.45% from last month",
    icon: Users,
  },
  {
    title: "Your Balance",
    value: "$1,000",
    description: "+8.47% from last month",
    icon: Activity,
  },
];

export function DashboardContent() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {item.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{item.value}</div>
                <p className="text-xs text-muted-foreground">
                  {item.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {/* Add more dashboard content here */}
    </div>
  );
}
