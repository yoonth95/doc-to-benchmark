import { FileText } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useApiKey } from "@/hooks/use-api-key";

const navigation = [{ label: "분석현황", to: "/analysis" }];

const Header = () => {
  const navigate = useNavigate();
  const { apiKey, setApiKey } = useApiKey();

  return (
    <header className="border-b border-border/40 bg-card/60 backdrop-blur-md">
      <div className="container mx-auto flex items-center justify-between px-5 py-5">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex items-center gap-2 w-42"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary">
            <FileText className="h-6 w-6 text-primary-foreground" />
          </span>
          <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            DocAgent
          </span>
        </button>

        <nav className="hidden items-center gap-6 md:flex">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                  isActive && "text-primary",
                )
              }
              end={item.to === "/"}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex w-full max-w-md items-center justify-end gap-3 md:w-auto">
          <Input
            type="password"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder="Solar Pro2 / Upstage API Key"
            className="min-w-0 flex-1"
            aria-label="OCR API Key"
          />
          <Button
            size="sm"
            className="bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90"
            onClick={() => navigate("/upload")}
          >
            문서 업로드
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
