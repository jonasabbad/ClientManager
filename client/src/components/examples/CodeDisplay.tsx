import { CodeDisplay } from "../CodeDisplay";
import { Toaster } from "@/components/ui/toaster";

export default function CodeDisplayExample() {
  return (
    <>
      <div className="p-8 max-w-md space-y-4">
        <CodeDisplay code="0612345678" service="Inwi" />
        <CodeDisplay code="0698765432" service="Orange" />
        <CodeDisplay code="123456789012" service="Water" />
      </div>
      <Toaster />
    </>
  );
}
