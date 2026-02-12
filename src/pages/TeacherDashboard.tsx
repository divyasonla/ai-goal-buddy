import { useState, useEffect } from "react";
import { fetchDailyGoals, fetchWeeklyGoals, fetchReports } from "@/lib/api";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Users, Target, TrendingUp, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TeacherDashboard = () => {
  const { toast } = useToast();
  const [dailyGoals, setDailyGoals] = useState<any[]>([]);
  const [weeklyGoals, setWeeklyGoals] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [dg, wg, rp] = await Promise.all([
          fetchDailyGoals(),
          fetchWeeklyGoals(),
          fetchReports(),
        ]);
        setDailyGoals(dg.goals || []);
        setWeeklyGoals(wg.goals || []);
        setReports(rp.reports || []);
      } catch (err: any) {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const uniqueStudents = new Set([...dailyGoals.map(g => g.email), ...weeklyGoals.map(g => g.email)]);
  const completedDaily = dailyGoals.filter(g => g.status === "Completed").length;

  const filterBySearch = (items: any[]) => {
    if (!search.trim()) return items;
    const s = search.toLowerCase();
    return items.filter(item => item.email?.toLowerCase().includes(s) || item.username?.toLowerCase().includes(s));
  };

  const statusColor = (s: string) => {
    if (s === "Completed") return "default" as const;
    if (s === "In Progress") return "secondary" as const;
    return "outline" as const;
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Teacher Dashboard</h1>
          <p className="text-sm text-muted-foreground">View all student goals and progress</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-primary shrink-0" />
                <div>
                  <p className="text-2xl font-bold">{uniqueStudents.size}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Students</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Target className="h-8 w-8 text-primary shrink-0" />
                <div>
                  <p className="text-2xl font-bold">{dailyGoals.length}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Daily Goals</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-primary shrink-0" />
                <div>
                  <p className="text-2xl font-bold">{dailyGoals.length > 0 ? Math.round((completedDaily / dailyGoals.length) * 100) : 0}%</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Complete</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Sparkles className="h-8 w-8 text-primary shrink-0" />
                <div>
                  <p className="text-2xl font-bold">{reports.length}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Reports</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Input placeholder="Search by student name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full sm:max-w-md" />

        {/* Tabs */}
        <Tabs defaultValue="daily">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="daily">Daily Goals</TabsTrigger>
            <TabsTrigger value="weekly">Weekly Goals</TabsTrigger>
            <TabsTrigger value="reports">AI Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="daily">
            <Card>
              <CardContent className="pt-6">
                <div className="overflow-x-auto -mx-6">
                  <div className="inline-block min-w-full align-middle px-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Goal</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="hidden md:table-cell">Went Well</TableHead>
                          <TableHead className="hidden sm:table-cell">Challenges</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filterBySearch(dailyGoals).sort((a, b) => b.date.localeCompare(a.date)).map((g, i) => (
                          <TableRow key={i}>
                            <TableCell>
                              <div><p className="font-medium text-sm">{g.username}</p><p className="text-xs text-muted-foreground hidden sm:block">{g.email}</p></div>
                            </TableCell>
                            <TableCell className="text-sm whitespace-nowrap">{g.date}</TableCell>
                            <TableCell className="max-w-[200px] truncate text-sm">{g.dailyGoal}</TableCell>
                            <TableCell><Badge variant={statusColor(g.status)}>{g.status}</Badge></TableCell>
                            <TableCell className="hidden md:table-cell max-w-[150px] truncate text-sm text-muted-foreground">{g.wentWell || "—"}</TableCell>
                            <TableCell className="hidden sm:table-cell max-w-[150px] truncate text-sm text-muted-foreground">{g.challenges || "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                {filterBySearch(dailyGoals).length === 0 && <p className="text-center py-8 text-muted-foreground">No daily goals found.</p>}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="weekly">
            <Card>
              <CardContent className="pt-6">
                <div className="overflow-x-auto -mx-6">
                  <div className="inline-block min-w-full align-middle px-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Week</TableHead>
                          <TableHead>Goal</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="hidden sm:table-cell">Challenges</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filterBySearch(weeklyGoals).sort((a, b) => b.week.localeCompare(a.week)).map((g, i) => (
                          <TableRow key={i}>
                            <TableCell>
                              <div><p className="font-medium text-sm">{g.username}</p><p className="text-xs text-muted-foreground hidden sm:block">{g.email}</p></div>
                            </TableCell>
                            <TableCell className="text-sm whitespace-nowrap">{g.week}</TableCell>
                            <TableCell className="max-w-[200px] truncate text-sm">{g.weeklyGoal}</TableCell>
                            <TableCell><Badge variant={statusColor(g.status)}>{g.status}</Badge></TableCell>
                            <TableCell className="hidden sm:table-cell max-w-[150px] truncate text-sm text-muted-foreground">{g.challenges || "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                {filterBySearch(weeklyGoals).length === 0 && <p className="text-center py-8 text-muted-foreground">No weekly goals found.</p>}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <div className="space-y-4">
              {filterBySearch(reports).length === 0 ? (
                <Card><CardContent className="py-8 text-center text-muted-foreground">No AI reports found.</CardContent></Card>
              ) : (
                filterBySearch(reports).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((r, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <CardTitle className="text-lg">{r.username} — Week {r.week}</CardTitle>
                          <p className="text-sm text-muted-foreground">{r.email}</p>
                        </div>
                        <div className={`text-sm font-semibold px-3 py-1 rounded-full w-fit ${
                          r.completionPercent >= 80 ? "bg-green-100 text-green-700" :
                          r.completionPercent >= 50 ? "bg-yellow-100 text-yellow-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          {r.completionPercent}%
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm max-w-none text-sm whitespace-pre-wrap">{r.aiFeedback}</div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default TeacherDashboard;
