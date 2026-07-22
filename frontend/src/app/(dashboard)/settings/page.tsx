import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Environment and account controls.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>API Configuration</CardTitle>
          <CardDescription>The frontend reads the backend URL from `NEXT_PUBLIC_API_URL`.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Local showcase value: `http://localhost:3000/api`
        </CardContent>
      </Card>
    </div>
  );
}
