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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">AI Weekly Reports</h1>
            <p className="text-muted-foreground">Get AI-powered insights on your progress</p>
          </div>
          <Button onClick={handleGenerate} disabled={generating}>
            {generating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</> : <><Sparkles className="h-4 w-4 mr-2" />Generate Report</>}
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : reports.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No reports yet. Add some daily goals and generate your first AI report!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reports.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((report, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Week {report.week}</CardTitle>
                    <div className="flex items-center gap-2">
                      <div className={`text-sm font-semibold px-3 py-1 rounded-full ${
                        report.completionPercent >= 80 ? "bg-green-100 text-green-700" :
                        report.completionPercent >= 50 ? "bg-yellow-100 text-yellow-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {report.completionPercent}% Complete
                      </div>
                    </div>
                  </div>
                  <CardDescription>{new Date(report.createdAt).toLocaleDateString()}</CardDescription>
                </CardHeader>
                <CardContent>
                  {report.mainChallenges && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Main Challenges</h4>
                      <p className="text-sm">{report.mainChallenges}</p>
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> AI Feedback
                    </h4>
                    <div className="prose prose-sm max-w-none text-sm whitespace-pre-wrap">{report.aiFeedback}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default StudentReportsPage;
