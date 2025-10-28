import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface CodeDisplayProps {
  code: string;
  service: string;
}

export function CodeDisplay({ code, service }: CodeDisplayProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast({
      title: "Code copied!",
      description: `${service} code has been copied to clipboard.`,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2 bg-muted px-3 py-2 rounded-md">
      <code className="flex-1 text-sm font-mono tracking-wide" data-testid={`text-code-${service.toLowerCase().replace(/\s+/g, '-')}`}>
        {code}
      </code>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0"
        onClick={handleCopy}
        data-testid={`button-copy-code-${service.toLowerCase().replace(/\s+/g, '-')}`}
      >
        {copied ? (
          <Check className="h-3 w-3 text-chart-4" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
      </Button>
    </div>
  );
}
