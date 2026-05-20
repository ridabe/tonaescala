import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const FROM_EMAIL = Deno.env.get('EMAIL_FROM') ?? 'noreply@tonaescala.com';
const APP_URL = Deno.env.get('APP_URL') ?? 'https://app.tonaescala.com';

type Assignment = {
  assignment_id: string;
  invitee_name: string;
  invitee_email: string;
  team_name: string | null;
  role: string | null;
  arrival_time: string | null;
  start_time: string | null;
  end_time: string | null;
  notes: string | null;
};

type Recipient = {
  recipient_id: string;
  assignment_id: string;
  invitee_email: string;
  invitee_name: string;
};

function formatDateTimePtBr(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  });
}

function formatTimePtBr(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function buildEmailHtml(params: {
  inviteeName: string;
  eventTitle: string;
  orgName: string;
  eventDate: string;
  eventLocation: string | null;
  teamName: string | null;
  role: string | null;
  arrivalTime: string | null;
  startTime: string | null;
  endTime: string | null;
  notes: string | null;
  inviteCode: string;
  inviteeEmail: string;
}): string {
  const base = APP_URL.replace(/\/+$/, '');
  const entryLink = `${base}/enter-event?invite_code=${params.inviteCode}`;
  const timeBlock = params.arrivalTime
    ? `Chegada: ${formatTimePtBr(params.arrivalTime)}${params.endTime ? ` · Término: ${formatTimePtBr(params.endTime)}` : ''}`
    : params.startTime
    ? `Início: ${formatTimePtBr(params.startTime)}${params.endTime ? ` · Término: ${formatTimePtBr(params.endTime)}` : ''}`
    : null;

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:sans-serif;color:#111">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;max-width:560px;width:100%">
        <!-- header -->
        <tr><td style="background:#6c47ff;padding:24px 32px">
          <p style="margin:0;font-size:20px;font-weight:700;color:#fff">ToNaEscala</p>
        </td></tr>
        <!-- body -->
        <tr><td style="padding:32px">
          <p style="margin:0 0 16px;font-size:16px">Olá, <strong>${params.inviteeName}</strong>!</p>
          <p style="margin:0 0 24px;font-size:15px;color:#444">Você está na escala para o seguinte evento:</p>

          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9fb;border-radius:8px;padding:20px;margin-bottom:24px">
            <tr><td style="padding:4px 0">
              <p style="margin:0;font-size:17px;font-weight:700;color:#111">${params.eventTitle}</p>
              <p style="margin:4px 0 0;font-size:13px;color:#777">${params.orgName}</p>
            </td></tr>
            <tr><td style="padding:12px 0 0">
              <p style="margin:0;font-size:14px;color:#444">📅 ${formatDateTimePtBr(params.eventDate)}</p>
              ${params.eventLocation ? `<p style="margin:4px 0 0;font-size:14px;color:#444">📍 ${params.eventLocation}</p>` : ''}
            </td></tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e5e5;border-radius:8px;padding:20px;margin-bottom:24px">
            <tr><td>
              <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#777;text-transform:uppercase;letter-spacing:.5px">Sua convocação</p>
              ${params.teamName ? `<p style="margin:0 0 4px;font-size:14px;color:#444"><strong>Equipe:</strong> ${params.teamName}</p>` : ''}
              ${params.role ? `<p style="margin:0 0 4px;font-size:14px;color:#444"><strong>Função:</strong> ${params.role}</p>` : ''}
              ${timeBlock ? `<p style="margin:0 0 4px;font-size:14px;color:#444"><strong>Horário:</strong> ${timeBlock}</p>` : ''}
              ${params.notes ? `<p style="margin:8px 0 0;font-size:13px;color:#666;font-style:italic">${params.notes}</p>` : ''}
            </td></tr>
          </table>

          <p style="margin:0 0 8px;font-size:15px">Para visualizar e responder sua convocação, acesse o app usando:</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0edff;border-radius:8px;padding:16px;margin-bottom:24px">
            <tr><td>
              <p style="margin:0 0 4px;font-size:14px;color:#444"><strong>Código do evento:</strong> <span style="font-family:monospace;font-size:15px;color:#6c47ff">${params.inviteCode}</span></p>
              <p style="margin:0;font-size:14px;color:#444"><strong>Email convocado:</strong> ${params.inviteeEmail}</p>
            </td></tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
              <a href="${entryLink}"
                style="display:inline-block;background:#6c47ff;color:#fff;font-size:15px;font-weight:600;padding:14px 32px;border-radius:8px;text-decoration:none">
                Abrir no app
              </a>
            </td></tr>
          </table>
        </td></tr>
        <!-- footer -->
        <tr><td style="background:#f9f9fb;padding:16px 32px;border-top:1px solid #e5e5e5">
          <p style="margin:0;font-size:12px;color:#999;text-align:center">
            Este é um email transacional enviado pelo ToNaEscala.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
  `.trim();
}

async function sendEmail(params: {
  to: string;
  toName: string;
  subject: string;
  html: string;
}): Promise<{ id?: string; error?: string }> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [`${params.toName} <${params.to}>`],
      subject: params.subject,
      html: params.html,
    }),
  });
  const json = await res.json();
  if (!res.ok) return { error: json.message ?? 'Resend error' };
  return { id: json.id };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return new Response('Unauthorized', { status: 401 });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // validate caller session
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', ''),
    );
    if (authError || !user) return new Response('Unauthorized', { status: 401 });

    const body = await req.json() as { event_id: string; campaign_id: string };
    const { event_id, campaign_id } = body;

    if (!event_id || !campaign_id) {
      return new Response(JSON.stringify({ error: 'event_id and campaign_id are required' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    // validate caller owns the campaign
    const { data: campaign } = await supabase
      .from('event_email_campaigns')
      .select('id, created_by, subject, status')
      .eq('id', campaign_id)
      .eq('event_id', event_id)
      .single();

    if (!campaign || campaign.created_by !== user.id) {
      return new Response('Forbidden', { status: 403 });
    }
    if (campaign.status === 'sending' || campaign.status === 'sent') {
      return new Response(JSON.stringify({ error: 'Campaign already sent or in progress' }), {
        status: 409, headers: { 'Content-Type': 'application/json' },
      });
    }

    // load event + org
    const { data: event } = await supabase
      .from('events')
      .select('id, title, invite_code, start_date, end_date, location, organization_id, organizations(name)')
      .eq('id', event_id)
      .single() as { data: any };

    if (!event) return new Response('Event not found', { status: 404 });

    const orgName: string = event.organizations?.name ?? '';
    const inviteCode: string = event.invite_code ?? '';

    // load queued recipients for this campaign
    const { data: recipients } = await supabase
      .from('event_email_recipients')
      .select('recipient_id:id, assignment_id, invitee_email, invitee_name')
      .eq('campaign_id', campaign_id)
      .eq('status', 'queued') as { data: Recipient[] | null };

    if (!recipients || recipients.length === 0) {
      await supabase
        .from('event_email_campaigns')
        .update({ status: 'sent', started_at: new Date().toISOString(), finished_at: new Date().toISOString() })
        .eq('id', campaign_id);
      return new Response(JSON.stringify({ sent: 0, failed: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // load assignment details for recipients
    const assignmentIds = recipients.map((r) => r.assignment_id);
    const { data: assignments } = await supabase
      .from('event_assignments')
      .select('id, invitee_name, invitee_email, team_id, role, arrival_time, start_time, end_time, notes, teams(name)')
      .in('id', assignmentIds) as { data: any[] | null };

    const assignmentMap = new Map<string, any>(
      (assignments ?? []).map((a) => [a.id, a]),
    );

    // mark campaign as sending
    await supabase
      .from('event_email_campaigns')
      .update({ status: 'sending', started_at: new Date().toISOString() })
      .eq('id', campaign_id);

    let sentCount = 0;
    let failedCount = 0;

    for (const recipient of recipients) {
      const assignment = assignmentMap.get(recipient.assignment_id);

      const html = buildEmailHtml({
        inviteeName: recipient.invitee_name,
        eventTitle: event.title,
        orgName,
        eventDate: event.start_date,
        eventLocation: event.location,
        teamName: assignment?.teams?.name ?? null,
        role: assignment?.role ?? null,
        arrivalTime: assignment?.arrival_time ?? null,
        startTime: assignment?.start_time ?? null,
        endTime: assignment?.end_time ?? null,
        notes: assignment?.notes ?? null,
        inviteCode,
        inviteeEmail: recipient.invitee_email,
      });

      const result = await sendEmail({
        to: recipient.invitee_email,
        toName: recipient.invitee_name,
        subject: campaign.subject,
        html,
      });

      if (result.id) {
        sentCount++;
        await supabase
          .from('event_email_recipients')
          .update({
            status: 'sent',
            provider_message_id: result.id,
            sent_at: new Date().toISOString(),
          })
          .eq('id', recipient.recipient_id);
      } else {
        failedCount++;
        await supabase
          .from('event_email_recipients')
          .update({ status: 'failed', error_message: result.error ?? 'unknown' })
          .eq('id', recipient.recipient_id);
      }
    }

    const finalStatus: string =
      failedCount === 0 ? 'sent'
      : sentCount === 0 ? 'failed'
      : 'partial_failed';

    await supabase
      .from('event_email_campaigns')
      .update({
        status: finalStatus,
        sent_count: sentCount,
        failed_count: failedCount,
        finished_at: new Date().toISOString(),
      })
      .eq('id', campaign_id);

    return new Response(JSON.stringify({ sent: sentCount, failed: failedCount }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err: any) {
    console.error('send-event-assignment-emails error:', err);
    return new Response(JSON.stringify({ error: err.message ?? 'Internal error' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
});
