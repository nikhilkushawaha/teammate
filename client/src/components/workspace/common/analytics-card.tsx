import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, ArrowBigUp, ArrowBigDown, Loader } from "lucide-react";

const AnalyticsCard = (props: {
  title: string;
  value: number;
  isLoading: boolean;
}) => {
  const { title, value, isLoading } = props;

  const getArrowIcon = () => {
    if (title === "Overdue Task") {
      return value > 0 ? (
        <ArrowBigDown strokeWidth={2.5} className="h-4 w-4 text-red-500" />
      ) : (
        <ArrowBigUp strokeWidth={2.5} className="h-4 w-4 text-green-500" />
      );
    }
    if (title === "Completed Task" || title === "Total Task") {
      return value > 0 ? (
        <ArrowBigUp strokeWidth={2.5} className="h-4 w-4 text-green-500" />
      ) : (
        <ArrowBigDown strokeWidth={2.5} className="h-4 w-4 text-red-500" />
      );
    }
    return null;
  };
  return (
    <Card className="shadow-md w-full transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-default">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-1">
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
          <div className="mb-[0.2px] transition-transform duration-300 hover:scale-110">{getArrowIcon()}</div>
        </div>
        <Activity
          strokeWidth={2.5}
          className="h-4 w-4 text-muted-foreground transition-colors duration-300 hover:text-primary"
        />
      </CardHeader>
      <CardContent className="w-full">
        <div className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          {isLoading ? <Loader className="w-6 h-6 animate-spin text-primary" /> : value}
        </div>
      </CardContent>
    </Card>
  );
};

export default AnalyticsCard;
