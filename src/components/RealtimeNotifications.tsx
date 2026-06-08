import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export function RealtimeNotifications() {
  const { user, role } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user || !role) return;

    const channel = supabase
      .channel("booking-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "bookings" },
        (payload) => {
          if (role === "driver") {
            const booking = payload.new as any;
            toast({
              title: "🚗 New Ride Request!",
              description: `Pickup: ${booking.pickup_location} • ${booking.trip_type}`,
            });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "bookings" },
        (payload) => {
          const booking = payload.new as any;
          const old = payload.old as any;

          // Notify customer when driver accepts their booking
          if (role === "customer" && booking.customer_id === user.id) {
            if (old.status === "pending" && (booking.status === "active" || booking.status === "accepted")) {
              toast({
                title: "✅ Driver Assigned!",
                description: "A driver has accepted your ride request.",
              });
            } else if (booking.status === "in-progress") {
              toast({
                title: "🚗 Ride Started!",
                description: `Your driver is on the way from ${booking.pickup_location}.`,
              });
            } else if (booking.status === "completed") {
              toast({
                title: "🎉 Ride Completed!",
                description: `Your trip from ${booking.pickup_location} is complete.${booking.fare ? ` Fare: ₹${booking.fare}` : ""}`,
              });
            } else if (booking.status === "cancelled") {
              toast({
                title: "❌ Booking Cancelled",
                description: "Your booking has been cancelled.",
                variant: "destructive",
              });
            }
          }

          // Notify driver about booking updates
          if (role === "driver" && booking.driver_id === user.id) {
            if (booking.status === "cancelled") {
              toast({
                title: "❌ Ride Cancelled",
                description: "The customer has cancelled this ride.",
                variant: "destructive",
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, role, toast]);

  return null;
}
