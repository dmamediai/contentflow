"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DEMO_EVENTS: { [key: string]: number } = {
  "2024-06-15": 3,
  "2024-06-18": 2,
  "2024-06-22": 1,
  "2024-06-25": 4,
};

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2024, 5, 1)); // June 2024

  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getDateKey = (day: number) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Calendar</h1>
          <p className="text-muted-foreground">View and manage your post schedule</p>
        </div>
        <Button
          className="flex items-center gap-2"
          onClick={() => toast.info("Schedule post - backend required")}
        >
          <Plus className="w-4 h-4" />
          Schedule Post
        </Button>
      </div>

      {/* Calendar Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>
              {MONTHS[month]} {year}
            </CardTitle>
            <CardDescription>Your posting schedule</CardDescription>
          </div>
          <div className="flex gap-2">
            <button
              onClick={previousMonth}
              className="p-2 hover:bg-muted rounded-lg transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-muted rounded-lg transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-2">
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="text-center font-semibold text-sm text-muted-foreground py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-2">
              {days.map((day, index) => {
                const dateKey = day ? getDateKey(day) : `empty-${index}`;
                const eventCount = day ? DEMO_EVENTS[dateKey] || 0 : 0;
                const isToday =
                  day &&
                  day === new Date().getDate() &&
                  month === new Date().getMonth() &&
                  year === new Date().getFullYear();

                return (
                  <div
                    key={dateKey}
                    onClick={() => {
                      if (day) {
                        toast.info(`${day} ${MONTHS[month]} - ${eventCount} posts scheduled`);
                      }
                    }}
                    className={`aspect-square p-2 rounded-lg border text-center cursor-pointer transition ${
                      day ? "hover:bg-muted" : "opacity-50"
                    } ${
                      isToday
                        ? "bg-primary text-primary-foreground border-primary"
                        : "hover:border-primary"
                    }`}
                  >
                    {day && (
                      <div className="h-full flex flex-col items-center justify-center">
                        <span className="font-semibold text-sm">{day}</span>
                        {eventCount > 0 && (
                          <span className="text-xs mt-1 px-2 py-0.5 bg-secondary rounded-full">
                            {eventCount}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Posts */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Posts</CardTitle>
          <CardDescription>Posts scheduled for the next 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { date: "Jun 15, 2024", time: "10:00 AM", title: "New Product Launch", platforms: ["Twitter", "LinkedIn", "Facebook"] },
              { date: "Jun 18, 2024", time: "2:00 PM", title: "Weekly Tips & Tricks", platforms: ["Instagram", "Twitter"] },
              { date: "Jun 22, 2024", time: "9:00 AM", title: "Behind the Scenes", platforms: ["Instagram Stories"] },
            ].map((post, idx) => (
              <div
                key={idx}
                className="p-4 border rounded-lg hover:bg-muted/50 transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{post.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {post.date} at {post.time}
                    </p>
                    <div className="flex gap-2 mt-2">
                      {post.platforms.map((platform) => (
                        <span
                          key={platform}
                          className="text-xs px-2 py-1 bg-muted rounded"
                        >
                          {platform}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toast.info("Edit post - backend required")}
                  >
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
