import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, Settings, BarChart3 } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/20">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" data-testid="icon-logo" />
            <h1 className="text-xl font-bold" data-testid="text-app-title">Customer Management</h1>
          </div>
          <Button asChild data-testid="button-login">
            <a href="/api/login">Sign In</a>
          </Button>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold tracking-tight" data-testid="text-hero-title">
              Manage Your Clients Efficiently
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto" data-testid="text-hero-description">
              A comprehensive solution for managing clients and their service codes. 
              Track activities, analyze data, and streamline your workflow.
            </p>
            <div className="pt-4">
              <Button size="lg" asChild data-testid="button-get-started">
                <a href="/api/login">Get Started</a>
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card data-testid="card-feature-clients">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <CardTitle>Client Management</CardTitle>
                </div>
                <CardDescription>
                  Store and organize client information with multiple service codes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Add clients with multiple service codes</li>
                  <li>• Search by name, phone, or code</li>
                  <li>• Print receipts in 80mm and A4 formats</li>
                </ul>
              </CardContent>
            </Card>

            <Card data-testid="card-feature-activities">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <CardTitle>Activity Tracking</CardTitle>
                </div>
                <CardDescription>
                  Monitor all changes and activities in real-time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Track client creation and updates</li>
                  <li>• Filter activities by date</li>
                  <li>• View complete audit trail</li>
                </ul>
              </CardContent>
            </Card>

            <Card data-testid="card-feature-analytics">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <CardTitle>Analytics Dashboard</CardTitle>
                </div>
                <CardDescription>
                  Gain insights with comprehensive analytics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Total clients and service codes</li>
                  <li>• Monthly growth statistics</li>
                  <li>• Service type breakdown</li>
                </ul>
              </CardContent>
            </Card>

            <Card data-testid="card-feature-settings">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  <CardTitle>Flexible Settings</CardTitle>
                </div>
                <CardDescription>
                  Customize service codes to match your needs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Create custom service categories</li>
                  <li>• Manage service code templates</li>
                  <li>• Activate or deactivate services</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <footer className="border-t py-6 bg-background/95">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground" data-testid="text-footer">
          <p>Customer Management System</p>
        </div>
      </footer>
    </div>
  );
}
