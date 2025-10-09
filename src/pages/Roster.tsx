import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, ChevronLeft, ChevronRight, Plus, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from "date-fns";

interface Profile {
  id: string;
  full_name: string;
  role: string;
}

interface Shift {
  id: string;
  user_id: string;
  shift_start: string;
  shift_end: string;
  shift_type: string;
  notes: string | null;
  profiles: Profile;
}

const Roster = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [formData, setFormData] = useState({
    user_id: "",
    shift_type: "day",
    start_time: "08:00",
    end_time: "17:00",
    notes: ""
  });

  useEffect(() => {
    fetchShifts();
    fetchProfiles();
  }, [currentMonth]);

  const fetchShifts = async () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);

    const { data, error } = await supabase
      .from("shifts")
      .select(`
        *,
        profiles(
          id,
          full_name,
          role
        )
      `)
      .gte("shift_start", start.toISOString())
      .lte("shift_end", end.toISOString())
      .order("shift_start");

    if (error) {
      toast.error("Failed to load shifts");
      console.error(error);
      return;
    }

    setShifts(data as any || []);
  };

  const fetchProfiles = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .in("role", ["nurse", "doctor"])
      .eq("is_active", true)
      .order("full_name");

    if (error) {
      toast.error("Failed to load staff");
      return;
    }

    setProfiles(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const shiftStart = new Date(selectedDate);
    const [startHour, startMin] = formData.start_time.split(":");
    shiftStart.setHours(parseInt(startHour), parseInt(startMin));

    const shiftEnd = new Date(selectedDate);
    const [endHour, endMin] = formData.end_time.split(":");
    shiftEnd.setHours(parseInt(endHour), parseInt(endMin));

    const { error } = await supabase.from("shifts").insert({
      user_id: formData.user_id,
      shift_start: shiftStart.toISOString(),
      shift_end: shiftEnd.toISOString(),
      shift_type: formData.shift_type,
      notes: formData.notes || null
    });

    if (error) {
      toast.error("Failed to create shift");
      return;
    }

    toast.success("Shift created successfully");
    setIsDialogOpen(false);
    setFormData({
      user_id: "",
      shift_type: "day",
      start_time: "08:00",
      end_time: "17:00",
      notes: ""
    });
    fetchShifts();
  };

  const handleDeleteShift = async (shiftId: string) => {
    const { error } = await supabase.from("shifts").delete().eq("id", shiftId);

    if (error) {
      toast.error("Failed to delete shift");
      return;
    }

    toast.success("Shift deleted");
    fetchShifts();
  };

  const monthDays = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const getShiftsForDay = (day: Date) => {
    return shifts.filter(shift => {
      const shiftDate = new Date(shift.shift_start);
      return isSameDay(shiftDate, day);
    });
  };

  const getShiftBadgeColor = (type: string) => {
    switch (type) {
      case "day": return "bg-blue-500";
      case "night": return "bg-purple-500";
      case "on-call": return "bg-orange-500";
      default: return "bg-gray-500";
    }
  };

  const getRoleBadgeColor = (role: string) => {
    return role === "doctor" ? "bg-green-600" : "bg-cyan-600";
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Staff Roster</h1>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Shift
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Shift</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={format(selectedDate, "yyyy-MM-dd")}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  required
                />
              </div>

              <div>
                <Label>Staff Member</Label>
                <Select value={formData.user_id} onValueChange={(value) => setFormData({ ...formData, user_id: value })} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.full_name} ({profile.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Shift Type</Label>
                <Select value={formData.shift_type} onValueChange={(value) => setFormData({ ...formData, shift_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Day Shift</SelectItem>
                    <SelectItem value="night">Night Shift</SelectItem>
                    <SelectItem value="on-call">On-Call</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label>Notes (Optional)</Label>
                <Input
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any special notes..."
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">Create Shift</Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between bg-card p-4 rounded-lg border">
        <Button variant="outline" size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-xl font-semibold">{format(currentMonth, "MMMM yyyy")}</h2>
        <Button variant="outline" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Week day headers */}
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="text-center font-semibold p-2 bg-muted rounded">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {monthDays.map((day) => {
          const dayShifts = getShiftsForDay(day);
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={day.toISOString()}
              className={`min-h-[140px] p-2 border rounded-lg ${
                isToday ? "border-primary border-2 bg-primary/5" : "border-border"
              }`}
            >
              <div className="font-semibold mb-2 text-sm">{format(day, "d")}</div>
              <div className="space-y-1">
                {dayShifts.map((shift) => (
                  <div
                    key={shift.id}
                    className="text-xs p-2 rounded bg-card border hover:shadow-sm transition-shadow cursor-pointer group relative"
                    onClick={() => {
                      if (window.confirm("Delete this shift?")) {
                        handleDeleteShift(shift.id);
                      }
                    }}
                  >
                    <div className="flex items-center gap-1 mb-1">
                      <User className="h-3 w-3" />
                      <span className="font-medium truncate">{shift.profiles.full_name}</span>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      <Badge className={`${getRoleBadgeColor(shift.profiles.role)} text-white text-[10px] px-1 py-0`}>
                        {shift.profiles.role}
                      </Badge>
                      <Badge className={`${getShiftBadgeColor(shift.shift_type)} text-white text-[10px] px-1 py-0`}>
                        {shift.shift_type}
                      </Badge>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1">
                      {format(new Date(shift.shift_start), "HH:mm")} - {format(new Date(shift.shift_end), "HH:mm")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="bg-card p-4 rounded-lg border">
        <h3 className="font-semibold mb-3">Legend</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-500 text-white">Day Shift</Badge>
            <span className="text-sm">08:00 - 17:00</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-purple-500 text-white">Night Shift</Badge>
            <span className="text-sm">17:00 - 08:00</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-orange-500 text-white">On-Call</Badge>
            <span className="text-sm">Variable</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-green-600 text-white">Doctor</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-cyan-600 text-white">Nurse</Badge>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Roster;
