import { supabase } from './supabase';

export type CampaignStatus = 'draft' | 'sending' | 'sent' | 'partial_failed' | 'failed';
export type RecipientStatus = 'queued' | 'sent' | 'failed' | 'skipped';

export type EmailCampaign = {
  campaign_id: string;
  subject: string;
  status: CampaignStatus;
  recipient_count: number;
  sent_count: number;
  failed_count: number;
  created_at: string;
  finished_at: string | null;
};

export type EmailCampaignRecipient = {
  recipient_id: string;
  invitee_name: string;
  invitee_email: string;
  status: RecipientStatus;
  provider_message_id: string | null;
  error_message: string | null;
  sent_at: string | null;
};

export async function createEmailCampaign(eventId: string): Promise<string> {
  const { data, error } = await supabase.rpc('create_event_email_campaign', {
    p_event_id: eventId,
  });
  if (error) throw error;
  return data as string;
}

export async function triggerEmailCampaign(
  eventId: string,
  campaignId: string,
): Promise<{ sent: number; failed: number }> {
  const { data, error } = await supabase.functions.invoke('send-event-assignment-emails', {
    body: { event_id: eventId, campaign_id: campaignId },
  });
  if (error) throw error;
  return data as { sent: number; failed: number };
}

export async function getEmailCampaigns(eventId: string): Promise<EmailCampaign[]> {
  const { data, error } = await supabase.rpc('get_event_email_campaigns', {
    p_event_id: eventId,
  });
  if (error) throw error;
  return (data as EmailCampaign[]) ?? [];
}

export async function getEmailCampaignRecipients(
  campaignId: string,
): Promise<EmailCampaignRecipient[]> {
  const { data, error } = await supabase.rpc('get_event_email_campaign_recipients', {
    p_campaign_id: campaignId,
  });
  if (error) throw error;
  return (data as EmailCampaignRecipient[]) ?? [];
}
