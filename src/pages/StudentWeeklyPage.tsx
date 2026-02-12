import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchWeeklyGoals, addWeeklyGoal, updateWeeklyGoal } from "@/lib/api";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WeeklyGoal {
  rowIndex: number; username: string; email: string; weeklyGoal: string;
  reflection: string; wentWell: string; challenges: string; left: string; week: string; status: string;
}

const emptyForm = { weeklyGoal: "", reflection: "", wentWell: "", challenges: "", left: "", status: "Pending" };

const StudentWeeklyPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [goals, setGoals] = useState<WeeklyGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingGoal, setEditingGoal] = useState<WeeklyGoal | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const loadGoals = async () => {
    try {
      const data = await fetchWeeklyGoals(user!.email);
      setGoals(data.goals || []);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadGoals(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.weeklyGoal.trim()) {
      toast({ title: "Error", description: "Goal is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (editingGoal) {
        await updateWeeklyGoal({
          rowIndex: editingGoal.rowIndex, username: user!.username, email: user!.email,
          weeklyGoal: form.weeklyGoal, reflection: form.reflection, wentWell: form.wentWell,
          challenges: form.challenges, left: form.left, week: editingGoal.week, status: form.status,
        });
        toast({ title: "Updated", description: "Weekly goal updated" });
      } else {
        await addWeeklyGoal({
          username: user!.username, email: user!.email, weeklyGoal: form.weeklyGoal,
          reflection: form.reflection, wentWell: form.wentWell, challenges: form.challenges,
          left: form.left, status: form.status,
        });
        toast({ title: "Added", description: "Weekly goal added" });
      }
      setForm(emptyForm);
      setEditingGoal(null);
      setDialogOpen(false);
      loadGoals();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (goal: WeeklyGoal) => {
    setEditingGoal(goal);
    setForm({ weeklyGoal: goal.weeklyGoal, reflection: goal.reflection, wentWell: goal.wentWell, challenges: goal.challenges, left: goal.left, status: goal.status });
    setDialogOpen(true);
  };

  const openAdd = () => { setEditingGoal(null); setForm(emptyForm); setDialogOpen(true); };

  const statusColor = (s: string) => {
    if (s === "Completed") return "default" as const;
    if (s === "In Progress") return "secondary" as const;
    return "outline" as const;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Weekly Goals</h1>
            <p className="text-muted-foreground">Plan and track your weekly objectives</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Add Goal</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingGoal ? "Edit Weekly Goal" : "Add Weekly Goal"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Weekly Goal *</Label>
                  <Input value={form.weeklyGoal} onChange={(e) => setForm({ ...form, weeklyGoal: e.target.value })} placeholder="What do you want to achieve this week?" />
                </div>
                <div className="space-y-2">
                  <Label>Reflection</Label>
                  <Textarea value={form.reflection} onChange={(e) => setForm({ ...form, reflection: e.target.value })} rows={2} />
                </div>
                <div className="space-y-2">
                  <Label>What Went Well</Label>
                  <Textarea value={form.wentWell} onChange={(e) => setForm({ ...form, wentWell: e.target.value })} rows={2} />
                </div>
                <div className="space-y-2">
                  <Label>Challenges</Label>
                  <Textarea value={form.challenges} onChange={(e) => setForm({ ...form, challenges: e.target.value })} rows={2} />
                </div>
                <div className="space-y-2">
                  <Label>What's Left</Label>
                  <Textarea value={form.left} onChange={(e) => setForm({ ...form, left: e.target.value })} rows={2} />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : editingGoal ? "Update Goal" : "Add Goal"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-lg">Your Weekly Goals</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : goals.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No weekly goals yet. Add your first one!</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Week</TableHead>
                    <TableHead>Goal</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Challenges</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {goals.sort((a, b) => b.week.localeCompare(a.week)).map((goal) => (
                    <TableRow key={goal.rowIndex}>
                      <TableCell className="whitespace-nowrap text-sm">{goal.week}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{goal.weeklyGoal}</TableCell>
                      <TableCell><Badge variant={statusColor(goal.status)}>{goal.status}</Badge></TableCell>
                      <TableCell className="max-w-[150px] truncate text-sm text-muted-foreground">{goal.challenges || "—"}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(goal)}><Edit className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default StudentWeeklyPage;
