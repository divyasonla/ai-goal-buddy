import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { generateReport, fetchReports } from "@/lib/api";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Sparkles, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Report {
  username: string; email: string; week: string; completionPercent: number;
  mainChallenges: string; aiFeedback: string; createdAt: string;
}

const StudentReportsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const loadReports = async () => {
    try {
      const data = await fetchReports(user!.email);
      setReports(data.reports || []);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReports(); }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const data = await generateReport(user!.email, user!.username);
      toast({ title: "Report Generated", description: "Your weekly AI report is ready!" });
      loadReports();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 px-4 md:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

        <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">AI Weekly Reports</h1>
            <p className="text-sm text-muted-foreground">Get AI-powered insights on your progress</p>
          </div>
        <Button onClick={handleGenerate} disabled={generating} className="w-full sm:w-auto">
            {generating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</> : <><Sparkles className="h-4 w-4 mr-2" />Generate Report</>}
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.map((report, index) => (
              <Card key={index} className="text-sm">
                <CardHeader>
                  <CardTitle className="text-lg">{report.username} — Week {report.week}</CardTitle>
                  <CardDescription>{report.email}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Completion: {report.completionPercent}%</p>
                  <p className="mt-2">{report.aiFeedback}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="flex justify-center">
          <Button onClick={handleGenerate} disabled={generating} className="mt-4">
            {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Generate Report
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default StudentReportsPage;
