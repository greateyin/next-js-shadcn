import { Progress } from "@/components/ui/progress";

interface PasswordStrengthMeterProps {
  score: number;
}

export function PasswordStrengthMeter({ score }: PasswordStrengthMeterProps) {
  const getColor = (score: number) => {
    switch (score) {
      case 0:
        return "bg-red-500";
      case 1:
        return "bg-orange-500";
      case 2:
        return "bg-yellow-500";
      case 3:
        return "bg-lime-500";
      case 4:
        return "bg-green-500";
      default:
        return "bg-gray-200";
    }
  };

  const getLabel = (score: number) => {
    switch (score) {
      case 0:
        return "Very Weak";
      case 1:
        return "Weak";
      case 2:
        return "Fair";
      case 3:
        return "Good";
      case 4:
        return "Strong";
      default:
        return "No Password";
    }
  };

  return (
    <div className="w-full space-y-2">
      <Progress 
        value={((score + 1) / 5) * 100} 
        className={`h-2 ${getColor(score)}`}
      />
      <p className="text-sm text-muted-foreground text-right">
        {getLabel(score)}
      </p>
    </div>
  );
}
