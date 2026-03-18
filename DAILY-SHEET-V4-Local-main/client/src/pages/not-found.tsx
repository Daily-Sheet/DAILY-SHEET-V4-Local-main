import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md mx-auto border-border shadow-xl">
        <CardContent className="pt-6 pb-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-10 w-10 text-destructive" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground font-display uppercase tracking-wide">404 Page Not Found</h1>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              The page you are looking for does not exist or has been moved.
            </p>
          </div>

          <div className="pt-2">
            <Link href="/" className="inline-block">
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8">
                Return to Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
