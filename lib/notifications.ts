export type NotificationChannel = "sms" | "whatsapp";
export type NotificationDeliveryStatus = "mocked" | "sent" | "partial" | "failed";

export interface NotificationRequest {
  toPhone: string;
  body: string;
}

export interface NotificationResult {
  channels: NotificationChannel[];
  status: NotificationDeliveryStatus;
  note: string;
}

function getConfiguredChannels(): NotificationChannel[] {
  const raw = process.env.NOTIFICATION_CHANNELS?.trim();
  if (!raw) {
    return ["sms", "whatsapp"];
  }

  const parsed = raw
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter((value): value is NotificationChannel => value === "sms" || value === "whatsapp");

  if (parsed.length === 0) {
    return ["sms"];
  }

  return parsed;
}

async function sendTwilioMessage(params: {
  accountSid: string;
  authToken: string;
  from: string;
  to: string;
  body: string;
}): Promise<{ ok: boolean; error?: string }> {
  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${params.accountSid}/Messages.json`;
  const auth = Buffer.from(`${params.accountSid}:${params.authToken}`).toString("base64");
  const body = new URLSearchParams({
    From: params.from,
    To: params.to,
    Body: params.body,
  });

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (response.ok) {
    return { ok: true };
  }

  let providerError = `HTTP ${response.status}`;
  try {
    const errorBody = (await response.json()) as {
      code?: number;
      message?: string;
      more_info?: string;
    };
    const message = errorBody.message?.trim();
    if (message) {
      providerError =
        typeof errorBody.code === "number"
          ? `${message} (code ${errorBody.code})`
          : message;
    }
  } catch {
    // Keep fallback HTTP status error message.
  }

  return { ok: false, error: providerError };
}

export async function sendPickupNotifications(
  request: NotificationRequest
): Promise<NotificationResult> {
  const channels = getConfiguredChannels();
  const mode = process.env.NOTIFICATION_MODE?.trim().toLowerCase() ?? "mock";
  if (mode !== "twilio") {
    return {
      channels,
      status: "mocked",
      note: `Mock mode enabled (NOTIFICATION_MODE=${mode || "undefined"}); no external provider called.`,
    };
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const smsFrom = process.env.TWILIO_SMS_FROM?.trim();
  const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM?.trim();

  if (!accountSid || !authToken) {
    return {
      channels,
      status: "mocked",
      note: `Twilio credentials missing (sid=${Boolean(accountSid)}, token=${Boolean(authToken)}). Falling back to mock mode.`,
    };
  }

  let successCount = 0;
  const channelErrors: string[] = [];

  for (const channel of channels) {
    try {
      if (channel === "sms" && smsFrom) {
        const result = await sendTwilioMessage({
          accountSid,
          authToken,
          from: smsFrom,
          to: request.toPhone,
          body: request.body,
        });
        if (result.ok) {
          successCount += 1;
        } else if (result.error) {
          channelErrors.push(`SMS: ${result.error}`);
        }
      }

      if (channel === "whatsapp" && whatsappFrom) {
        const result = await sendTwilioMessage({
          accountSid,
          authToken,
          from: `whatsapp:${whatsappFrom}`,
          to: `whatsapp:${request.toPhone}`,
          body: request.body,
        });
        if (result.ok) {
          successCount += 1;
        } else if (result.error) {
          channelErrors.push(`WhatsApp: ${result.error}`);
        }
      }
    } catch {
      channelErrors.push(
        channel === "sms"
          ? "SMS: Network error while calling Twilio."
          : "WhatsApp: Network error while calling Twilio."
      );
    }
  }

  if (successCount === channels.length) {
    return {
      channels,
      status: "sent",
      note: "All notifications delivered to provider.",
    };
  }

  if (successCount > 0) {
    return {
      channels,
      status: "partial",
      note:
        channelErrors.length > 0
          ? `Some channels were accepted. ${channelErrors.join(" | ")}`
          : "Some channels were accepted by provider.",
    };
  }

  return {
    channels,
    status: "failed",
    note:
      channelErrors.length > 0
        ? channelErrors.join(" | ")
        : "Provider rejected all channels.",
  };
}
