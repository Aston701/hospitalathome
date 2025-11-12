import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Activity, 
  Download, 
  TrendingUp, 
  Users, 
  Calendar,
  Clock,
  MapPin,
  Award,
  Percent,
  RefreshCw,
  Sparkles
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { format, startOfMonth, endOfMonth, startOfYear, differenceInMinutes } from "date-fns";
import * as XLSX from "xlsx";

const Analytics = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [period, setPeriod] = useState("month");
  const [aiInsights, setAiInsights] = useState("");
  
  // Monthly Stats
  const [monthlyStats, setMonthlyStats] = useState({
    totalVisits: 0,
    visitsPerNurse: [] as any[],
    visitsPerDoctor: [] as any[],
    avgVisitTime: 0,
    bookingsPerController: [] as any[],
    newPatients: 0,
    avgVisitsPerPatient: 0
  });

  // Cumulative Stats
  const [cumulativeStats, setCumulativeStats] = useState({
    totalVisits: 0,
    visitsPerNurse: [] as any[],
    visitsPerDoctor: [] as any[],
    avgVisitTime: 0,
    bookingsPerController: [] as any[],
    newPatients: 0,
    avgVisitsPerPatient: 0
  });

  // AI Metrics
  const [aiMetrics, setAiMetrics] = useState({
    cancellationRate: 0,
    revisitRate: 0,
    avgResponseTime: 0,
    topRegions: [] as any[],
    topPerformers: {
      nurse: null as any,
      doctor: null as any,
      controller: null as any
    },
    utilizationRate: 0,
    deviceUtilization: [] as any[]
  });

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);
      const yearStart = startOfYear(now);

      // Fetch visits based on period
      const dateFilter = period === "month" 
        ? { gte: monthStart.toISOString(), lte: monthEnd.toISOString() }
        : { gte: yearStart.toISOString() };

      // Monthly visits
      const { data: monthlyVisits } = await supabase
        .from("visits")
        .select(`
          *,
          patient:patients(*),
          nurse:profiles!nurse_id(id, full_name),
          doctor:profiles!doctor_id(id, full_name),
          dispatch_events(*)
        `)
        .gte("scheduled_start", monthStart.toISOString())
        .lte("scheduled_start", monthEnd.toISOString());

      // All visits for cumulative
      const { data: allVisits } = await supabase
        .from("visits")
        .select(`
          *,
          patient:patients(*),
          nurse:profiles!nurse_id(id, full_name),
          doctor:profiles!doctor_id(id, full_name),
          dispatch_events(*)
        `);

      // Patients
      const { data: allPatients } = await supabase
        .from("patients")
        .select("*");

      // Calculate monthly stats
      if (monthlyVisits) {
        const completedVisits = monthlyVisits.filter(v => v.status === "complete");
        
        // Visits per nurse
        const nurseMap = new Map();
        completedVisits.forEach(v => {
          if (v.nurse) {
            const count = nurseMap.get(v.nurse.id) || { name: v.nurse.full_name, visits: 0 };
            count.visits++;
            nurseMap.set(v.nurse.id, count);
          }
        });

        // Visits per doctor
        const doctorMap = new Map();
        completedVisits.forEach(v => {
          if (v.doctor) {
            const count = doctorMap.get(v.doctor.id) || { name: v.doctor.full_name, visits: 0 };
            count.visits++;
            doctorMap.set(v.doctor.id, count);
          }
        });

        // Average visit time
        let totalMinutes = 0;
        let countWithTimes = 0;
        completedVisits.forEach(v => {
          const onSiteEvent = v.dispatch_events?.find((e: any) => e.type === "on_site");
          const completeEvent = v.dispatch_events?.find((e: any) => e.type === "complete");
          if (onSiteEvent && completeEvent) {
            const minutes = differenceInMinutes(
              new Date(completeEvent.timestamp),
              new Date(onSiteEvent.timestamp)
            );
            totalMinutes += minutes;
            countWithTimes++;
          }
        });

        // New patients this month
        const newPatientsCount = allPatients?.filter(p => {
          const created = new Date(p.created_at);
          return created >= monthStart && created <= monthEnd;
        }).length || 0;

        // Unique patients this month
        const uniquePatients = new Set(monthlyVisits.map(v => v.patient_id));

        setMonthlyStats({
          totalVisits: completedVisits.length,
          visitsPerNurse: Array.from(nurseMap.values()),
          visitsPerDoctor: Array.from(doctorMap.values()),
          avgVisitTime: countWithTimes > 0 ? Math.round(totalMinutes / countWithTimes) : 0,
          bookingsPerController: [], // Would need requests table data
          newPatients: newPatientsCount,
          avgVisitsPerPatient: uniquePatients.size > 0 
            ? Number((completedVisits.length / uniquePatients.size).toFixed(1))
            : 0
        });
      }

      // Calculate cumulative stats (similar logic for all time)
      if (allVisits) {
        const completedVisits = allVisits.filter(v => v.status === "complete");
        
        const nurseMap = new Map();
        completedVisits.forEach(v => {
          if (v.nurse) {
            const count = nurseMap.get(v.nurse.id) || { name: v.nurse.full_name, visits: 0 };
            count.visits++;
            nurseMap.set(v.nurse.id, count);
          }
        });

        const doctorMap = new Map();
        completedVisits.forEach(v => {
          if (v.doctor) {
            const count = doctorMap.get(v.doctor.id) || { name: v.doctor.full_name, visits: 0 };
            count.visits++;
            doctorMap.set(v.doctor.id, count);
          }
        });

        let totalMinutes = 0;
        let countWithTimes = 0;
        completedVisits.forEach(v => {
          const onSiteEvent = v.dispatch_events?.find((e: any) => e.type === "on_site");
          const completeEvent = v.dispatch_events?.find((e: any) => e.type === "complete");
          if (onSiteEvent && completeEvent) {
            const minutes = differenceInMinutes(
              new Date(completeEvent.timestamp),
              new Date(onSiteEvent.timestamp)
            );
            totalMinutes += minutes;
            countWithTimes++;
          }
        });

        const uniquePatients = new Set(allVisits.map(v => v.patient_id));

        setCumulativeStats({
          totalVisits: completedVisits.length,
          visitsPerNurse: Array.from(nurseMap.values()),
          visitsPerDoctor: Array.from(doctorMap.values()),
          avgVisitTime: countWithTimes > 0 ? Math.round(totalMinutes / countWithTimes) : 0,
          bookingsPerController: [],
          newPatients: allPatients?.length || 0,
          avgVisitsPerPatient: uniquePatients.size > 0 
            ? Number((completedVisits.length / uniquePatients.size).toFixed(1))
            : 0
        });

        // Calculate AI metrics
        const totalBookings = allVisits.length;
        const cancelled = allVisits.filter(v => v.status === "cancelled").length;
        const cancellationRate = totalBookings > 0 
          ? Number(((cancelled / totalBookings) * 100).toFixed(1))
          : 0;

        // Revisit rate (patients with >1 visit this month)
        const patientVisitCount = new Map();
        monthlyVisits?.forEach(v => {
          const count = patientVisitCount.get(v.patient_id) || 0;
          patientVisitCount.set(v.patient_id, count + 1);
        });
        const revisitingPatients = Array.from(patientVisitCount.values()).filter(c => c > 1).length;
        const revisitRate = patientVisitCount.size > 0
          ? Number(((revisitingPatients / patientVisitCount.size) * 100).toFixed(1))
          : 0;

        // Average response time (booking to on-site)
        let totalResponseMinutes = 0;
        let responseCount = 0;
        completedVisits.forEach(v => {
          const onSiteEvent = v.dispatch_events?.find((e: any) => e.type === "on_site");
          if (onSiteEvent) {
            const minutes = differenceInMinutes(
              new Date(onSiteEvent.timestamp),
              new Date(v.created_at)
            );
            totalResponseMinutes += minutes;
            responseCount++;
          }
        });

        // Top regions (from patient addresses)
        const regionMap = new Map();
        completedVisits.forEach(v => {
          if (v.patient?.city) {
            const count = regionMap.get(v.patient.city) || { region: v.patient.city, visits: 0 };
            count.visits++;
            regionMap.set(v.patient.city, count);
          }
        });

        // Top performers
        const topNurse = Array.from(nurseMap.values()).sort((a, b) => b.visits - a.visits)[0];
        const topDoctor = Array.from(doctorMap.values()).sort((a, b) => b.visits - a.visits)[0];

        // Medical boxes utilization
        const { data: medicalBoxes } = await supabase
          .from("medical_boxes")
          .select("*");

        const activeBoxes = medicalBoxes?.filter(b => b.status === "in_service").length || 0;
        const totalBoxes = medicalBoxes?.length || 0;

        setAiMetrics({
          cancellationRate,
          revisitRate,
          avgResponseTime: responseCount > 0 ? Math.round(totalResponseMinutes / responseCount) : 0,
          topRegions: Array.from(regionMap.values()).sort((a, b) => b.visits - a.visits).slice(0, 5),
          topPerformers: {
            nurse: topNurse,
            doctor: topDoctor,
            controller: null
          },
          utilizationRate: totalBoxes > 0 
            ? Number(((activeBoxes / totalBoxes) * 100).toFixed(1))
            : 0,
          deviceUtilization: medicalBoxes?.map(b => ({
            label: b.label,
            status: b.status
          })) || []
        });
      }

    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateAIInsights = async () => {
    setAiLoading(true);
    try {
      const stats = period === "month" ? monthlyStats : cumulativeStats;
      
      const { data, error } = await supabase.functions.invoke("generate-analytics-insights", {
        body: {
          period,
          monthlyStats,
          cumulativeStats,
          aiMetrics
        }
      });

      if (error) throw error;
      
      setAiInsights(data.insights);
      toast({
        title: "AI Insights Generated",
        description: "Fresh insights have been generated from your data"
      });
    } catch (error) {
      console.error("Error generating AI insights:", error);
      toast({
        title: "Error",
        description: "Failed to generate AI insights",
        variant: "destructive"
      });
    } finally {
      setAiLoading(false);
    }
  };

  const exportToExcel = () => {
    const stats = period === "month" ? monthlyStats : cumulativeStats;
    
    const wb = XLSX.utils.book_new();
    
    // Summary sheet
    const summaryData = [
      ["AI Operations Analytics Report"],
      ["Generated:", format(new Date(), "yyyy-MM-dd HH:mm")],
      ["Period:", period === "month" ? "Current Month" : "All Time"],
      [],
      ["Metric", "Value"],
      ["Total Visits", stats.totalVisits],
      ["Average Visit Time (min)", stats.avgVisitTime],
      ["New Patients", stats.newPatients],
      ["Avg Visits per Patient", stats.avgVisitsPerPatient],
      ["Cancellation Rate (%)", aiMetrics.cancellationRate],
      ["Revisit Rate (%)", aiMetrics.revisitRate],
      ["Avg Response Time (min)", aiMetrics.avgResponseTime],
      ["Device Utilization (%)", aiMetrics.utilizationRate]
    ];
    
    const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws1, "Summary");
    
    // Visits per nurse
    if (stats.visitsPerNurse.length > 0) {
      const ws2 = XLSX.utils.json_to_sheet(stats.visitsPerNurse);
      XLSX.utils.book_append_sheet(wb, ws2, "Visits per Nurse");
    }
    
    // Visits per doctor
    if (stats.visitsPerDoctor.length > 0) {
      const ws3 = XLSX.utils.json_to_sheet(stats.visitsPerDoctor);
      XLSX.utils.book_append_sheet(wb, ws3, "Visits per Doctor");
    }
    
    // Top regions
    if (aiMetrics.topRegions.length > 0) {
      const ws4 = XLSX.utils.json_to_sheet(aiMetrics.topRegions);
      XLSX.utils.book_append_sheet(wb, ws4, "Top Regions");
    }
    
    XLSX.writeFile(wb, `analytics-${period}-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    
    toast({
      title: "Export Complete",
      description: "Analytics exported to Excel successfully"
    });
  };

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Activity className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const stats = period === "month" ? monthlyStats : cumulativeStats;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">AI Operations Analytics</h1>
          <p className="text-muted-foreground">
            Real-time operational insights and performance metrics
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchAnalytics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportToExcel}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Period Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Time Period</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={period} onValueChange={setPeriod}>
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="month">Current Month</TabsTrigger>
              <TabsTrigger value="cumulative">All Time (Cumulative)</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Visits
            </CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalVisits}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Completed visits
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Visit Time
            </CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.avgVisitTime}m</div>
            <p className="text-xs text-muted-foreground mt-1">
              Average duration
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              New Patients
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.newPatients}</div>
            <p className="text-xs text-muted-foreground mt-1">
              First-time users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Visits per Patient
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.avgVisitsPerPatient}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Average per patient
            </p>
          </CardContent>
        </Card>
      </div>

      {/* AI Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cancellation Rate
            </CardTitle>
            <Percent className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{aiMetrics.cancellationRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Of total bookings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revisit Rate
            </CardTitle>
            <RefreshCw className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{aiMetrics.revisitRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Returning patients
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Response Time
            </CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{aiMetrics.avgResponseTime}m</div>
            <p className="text-xs text-muted-foreground mt-1">
              Booking to on-site
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Device Utilization
            </CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{aiMetrics.utilizationRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active medical boxes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visits per Nurse */}
        <Card>
          <CardHeader>
            <CardTitle>Visits per Nurse</CardTitle>
            <CardDescription>Performance breakdown by nurse</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.visitsPerNurse}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="visits" fill="hsl(var(--chart-1))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Visits per Doctor */}
        <Card>
          <CardHeader>
            <CardTitle>Visits per Doctor</CardTitle>
            <CardDescription>Performance breakdown by doctor</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.visitsPerDoctor}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="visits" fill="hsl(var(--chart-2))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Regions */}
        <Card>
          <CardHeader>
            <CardTitle>Top Regions</CardTitle>
            <CardDescription>Visits by location</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={aiMetrics.topRegions}
                  dataKey="visits"
                  nameKey="region"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {aiMetrics.topRegions.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
            <CardDescription>Best performing staff members</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {aiMetrics.topPerformers.nurse && (
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Award className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="font-medium">{aiMetrics.topPerformers.nurse.name}</p>
                    <p className="text-sm text-muted-foreground">Top Nurse</p>
                  </div>
                </div>
                <div className="text-2xl font-bold">{aiMetrics.topPerformers.nurse.visits}</div>
              </div>
            )}
            {aiMetrics.topPerformers.doctor && (
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Award className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="font-medium">{aiMetrics.topPerformers.doctor.name}</p>
                    <p className="text-sm text-muted-foreground">Top Doctor</p>
                  </div>
                </div>
                <div className="text-2xl font-bold">{aiMetrics.topPerformers.doctor.visits}</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI-Generated Insights
              </CardTitle>
              <CardDescription>Automated analysis and recommendations</CardDescription>
            </div>
            <Button onClick={generateAIInsights} disabled={aiLoading}>
              {aiLoading ? (
                <Activity className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Generate Insights
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {aiInsights ? (
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap">{aiInsights}</p>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Click "Generate Insights" to get AI-powered analysis of your data</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;
