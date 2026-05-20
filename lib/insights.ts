import { supabase } from './supabase';
import type { Event } from './types';
import type { AssignmentStatus } from './assignments';

type AssignmentRow = {
  event_id: string;
  invitee_email: string | null;
  invitee_name: string | null;
  response_status: AssignmentStatus;
};

type ScheduleRow = {
  event_id: string;
  participant_id: string;
  confirmation: { status: 'confirmed' | 'declined' | 'late' } | { status: 'confirmed' | 'declined' | 'late' }[] | null;
};

export type EventInsight = {
  event: Event;
  total: number;
  accepted: number;
  declined: number;
  pending: number;
  uniquePeople: number;
  responseRate: number;
};

export type MonthlyInsights = {
  monthStart: string;
  monthEnd: string;
  eventsCreated: number;
  totalScaled: number;
  uniquePeople: number;
  accepted: number;
  declined: number;
  pending: number;
  responseRate: number;
  events: EventInsight[];
};

function monthRange(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1, 0, 0, 0, 0);
  return { start, end };
}

function normalizeConfirmation(row: ScheduleRow) {
  return Array.isArray(row.confirmation) ? row.confirmation[0] ?? null : row.confirmation;
}

export async function fetchMonthlyInsights(
  orgId: string,
  referenceDate = new Date(),
): Promise<MonthlyInsights> {
  const { start, end } = monthRange(referenceDate);

  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('*')
    .eq('organization_id', orgId)
    .neq('status', 'archived')
    .gte('created_at', start.toISOString())
    .lt('created_at', end.toISOString())
    .order('start_date', { ascending: true });

  if (eventsError) throw eventsError;

  const monthEvents = (events ?? []) as Event[];
  const eventIds = monthEvents.map((event) => event.id);

  if (eventIds.length === 0) {
    return {
      monthStart: start.toISOString(),
      monthEnd: end.toISOString(),
      eventsCreated: 0,
      totalScaled: 0,
      uniquePeople: 0,
      accepted: 0,
      declined: 0,
      pending: 0,
      responseRate: 0,
      events: [],
    };
  }

  const [{ data: assignments, error: assignmentsError }, { data: schedules, error: schedulesError }] = await Promise.all([
    supabase
      .from('event_assignments')
      .select('event_id, invitee_email, invitee_name, response_status')
      .in('event_id', eventIds),
    supabase
      .from('schedules')
      .select(`
        event_id,
        participant_id,
        confirmation:confirmations(status)
      `)
      .in('event_id', eventIds),
  ]);

  if (assignmentsError) throw assignmentsError;
  if (schedulesError) throw schedulesError;

  const assignmentsByEvent = new Map<string, AssignmentRow[]>();
  for (const assignment of ((assignments ?? []) as AssignmentRow[])) {
    const current = assignmentsByEvent.get(assignment.event_id) ?? [];
    current.push(assignment);
    assignmentsByEvent.set(assignment.event_id, current);
  }

  const schedulesByEvent = new Map<string, ScheduleRow[]>();
  for (const schedule of ((schedules ?? []) as ScheduleRow[])) {
    const current = schedulesByEvent.get(schedule.event_id) ?? [];
    current.push(schedule);
    schedulesByEvent.set(schedule.event_id, current);
  }

  let totalScaled = 0;
  let accepted = 0;
  let declined = 0;
  let pending = 0;
  const uniquePeople = new Set<string>();

  const eventInsights = monthEvents.map((event) => {
    const eventAssignments = assignmentsByEvent.get(event.id) ?? [];
    const eventSchedules = schedulesByEvent.get(event.id) ?? [];
    const usesAssignments = eventAssignments.length > 0;

    let eventAccepted = 0;
    let eventDeclined = 0;
    let eventPending = 0;
    const eventPeople = new Set<string>();

    if (usesAssignments) {
      for (const assignment of eventAssignments) {
        if (assignment.response_status === 'accepted') eventAccepted += 1;
        if (assignment.response_status === 'declined') eventDeclined += 1;
        if (assignment.response_status === 'pending') eventPending += 1;
        const personKey = assignment.invitee_email?.toLowerCase().trim() || assignment.invitee_name || `${event.id}-${eventPeople.size}`;
        eventPeople.add(personKey);
        uniquePeople.add(personKey);
      }
    } else {
      for (const schedule of eventSchedules) {
        const confirmation = normalizeConfirmation(schedule);
        if (confirmation?.status === 'declined') eventDeclined += 1;
        else if (confirmation?.status === 'confirmed' || confirmation?.status === 'late') eventAccepted += 1;
        else eventPending += 1;
        eventPeople.add(schedule.participant_id);
        uniquePeople.add(schedule.participant_id);
      }
    }

    const total = usesAssignments ? eventAssignments.length : eventSchedules.length;
    const responded = eventAccepted + eventDeclined;
    const responseRate = total > 0 ? Math.round((responded / total) * 100) : 0;

    totalScaled += total;
    accepted += eventAccepted;
    declined += eventDeclined;
    pending += eventPending;

    return {
      event,
      total,
      accepted: eventAccepted,
      declined: eventDeclined,
      pending: eventPending,
      uniquePeople: eventPeople.size,
      responseRate,
    };
  });

  const responseRate = totalScaled > 0 ? Math.round(((accepted + declined) / totalScaled) * 100) : 0;

  return {
    monthStart: start.toISOString(),
    monthEnd: end.toISOString(),
    eventsCreated: monthEvents.length,
    totalScaled,
    uniquePeople: uniquePeople.size,
    accepted,
    declined,
    pending,
    responseRate,
    events: eventInsights,
  };
}
