export type Organization = {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type EventStatus = 'active' | 'cancelled' | 'archived';

export type Event = {
  id: string;
  organization_id: string;
  parent_event_id: string | null;
  title: string;
  description: string | null;
  category: string | null;
  location: string | null;
  start_date: string;
  end_date: string | null;
  color: string;
  invite_code: string | null;
  status: EventStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type EventWithSubEvents = Event & { sub_events: Event[] };

export type Team = {
  id: string;
  organization_id: string;
  name: string;
  type: string | null;
  created_at: string;
  updated_at: string;
};

export type Participant = {
  id: string;
  name: string;
  phone: string | null;
  device_id: string | null;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ConfirmationStatus = 'confirmed' | 'declined' | 'late';

export type Schedule = {
  id: string;
  event_id: string;
  participant_id: string;
  team_id: string | null;
  role: string | null;
  start_time: string | null;
  end_time: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  participant?: Participant;
  team?: Team | null;
  confirmation?: { status: ConfirmationStatus } | null;
};

export type Confirmation = {
  id: string;
  schedule_id: string;
  participant_id: string;
  status: ConfirmationStatus;
  response_message: string | null;
  responded_at: string;
};

export type EventCreatePayload = {
  organization_id: string;
  parent_event_id?: string;
  title: string;
  description?: string;
  category?: string;
  location?: string;
  start_date: string;
  end_date?: string;
  color: string;
};

export type ScheduleCreatePayload = {
  event_id: string;
  participant_id: string;
  team_id?: string;
  role?: string;
  start_time?: string;
  end_time?: string;
  notes?: string;
};
