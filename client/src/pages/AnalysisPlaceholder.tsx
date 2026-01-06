import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";

interface AnalysisPlaceholderProps {
  title: string;
  description: string;
  icon?: string;
}

export default function AnalysisPlaceholder({ 
  title, 
  description,
  icon = "📊"
}: AnalysisPlaceholderProps) {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex flex-col">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </Button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md text-center space-y-6">
          <div className="text-6xl">{icon}</div>
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-yellow-200 to-primary">
              {title}
            </h1>
            <p className="text-muted-foreground text-lg">
              {description}
            </p>
          </div>
          <div className="bg-card/50 border border-primary/20 rounded-lg p-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              该分析页面正在开发中，我们的专业团队正在为您准备详细的市场分析和投资建议。
            </p>
            <p className="text-xs text-muted-foreground">
              敬请期待！如有任何问题，欢迎联系我们的投资顾问。
            </p>
          </div>
          <Button 
            onClick={() => setLocation("/")}
            className="w-full bg-primary hover:bg-primary/90"
          >
            返回首页
          </Button>
        </div>
      </main>
    </div>
  );
}
