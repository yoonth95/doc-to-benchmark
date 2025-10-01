import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const QualityComparison = () => {
  const results = [
    { metric: "Accuracy", google: "98.5%", aws: "97.8%", azure: "99.1%" },
    { metric: "Processing Speed", google: "Fast", aws: "Medium", azure: "Very Fast" },
    { metric: "Text Recognition", google: "Excellent", aws: "Good", azure: "Excellent" },
    { metric: "Table Detection", google: "Good", aws: "Excellent", azure: "Very Good" },
  ];

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">OCR 품질 비교</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold text-foreground">Metric</TableHead>
              <TableHead className="font-semibold text-foreground">Google Vision</TableHead>
              <TableHead className="font-semibold text-foreground">AWS Textract</TableHead>
              <TableHead className="font-semibold text-foreground">Azure DI</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((row) => (
              <TableRow key={row.metric}>
                <TableCell className="font-medium text-foreground">{row.metric}</TableCell>
                <TableCell className="text-muted-foreground">{row.google}</TableCell>
                <TableCell className="text-muted-foreground">{row.aws}</TableCell>
                <TableCell className="text-muted-foreground">{row.azure}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default QualityComparison;
