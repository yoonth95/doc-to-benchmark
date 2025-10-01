import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";

const CostAnalysis = () => {
  const costs = [
    { service: "Google Vision API", amount: "$0.045", requests: 3 },
    { service: "AWS Textract", amount: "$0.032", requests: 2 },
    { service: "Azure Document Intelligence", amount: "$0.028", requests: 1 },
  ];

  const totalCost = costs.reduce((sum, item) => sum + parseFloat(item.amount.slice(1)), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">비용 분석</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {costs.map((cost) => (
            <div
              key={cost.service}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
            >
              <div>
                <p className="font-medium text-foreground">{cost.service}</p>
                <p className="text-xs text-muted-foreground">{cost.requests} requests</p>
              </div>
              <div className="flex items-center gap-1 text-foreground font-semibold">
                <DollarSign className="w-4 h-4" />
                <span>{cost.amount.slice(1)}</span>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-border">
            <p className="font-semibold text-foreground">Total Cost</p>
            <div className="flex items-center gap-1 text-primary font-bold text-lg">
              <DollarSign className="w-5 h-5" />
              <span>{totalCost.toFixed(3)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CostAnalysis;
