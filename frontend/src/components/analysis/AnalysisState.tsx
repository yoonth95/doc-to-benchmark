interface AnalysisStateProps {
  message: string;
  variant?: "default" | "error";
}

const AnalysisState = ({ message, variant = "default" }: AnalysisStateProps) => (
  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-background via-accent/30 to-background">
    <div
      className={`text-sm ${
        variant === "error" ? "text-destructive" : "text-muted-foreground"
      }`}
    >
      {message}
    </div>
  </div>
);

export default AnalysisState;
