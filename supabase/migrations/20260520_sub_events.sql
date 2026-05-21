-- Sub-events: allow events to be children of a master event
ALTER TABLE events
  ADD COLUMN parent_event_id uuid REFERENCES events(id) ON DELETE CASCADE;

CREATE INDEX events_parent_event_id_idx ON events(parent_event_id);
