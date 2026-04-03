import { NextResponse } from "next/server";
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";

function getServerSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function getCalendarClient() {
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });

  return google.calendar({ version: "v3", auth });
}

export async function POST(req: Request) {
  try {
    const { requestId } = await req.json();

    if (!requestId) {
      return NextResponse.json(
        { success: false, message: "Missing requestId." },
        { status: 400 }
      );
    }

    const supabase = getServerSupabase();

    const { data: requestRow, error: loadError } = await supabase
      .from("requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (loadError || !requestRow) {
      return NextResponse.json(
        { success: false, message: "Could not load request." },
        { status: 500 }
      );
    }

    const calendar = getCalendarClient();

    const who = String(requestRow.who_are_you || "");
    const isLauren = who.toLowerCase().includes("lauren");

    const description = [
      `Who are you?: ${requestRow.who_are_you || ""}`,
      `Sleepover: ${requestRow.sleepover || ""}`,
      `Equipment required: ${
        Array.isArray(requestRow.equipment_required)
          ? requestRow.equipment_required.join(", ")
          : ""
      }`,
      `Other equipment: ${requestRow.other_equipment || "None"}`,
      `Purpose: ${requestRow.purpose || "Not provided"}`,
    ].join("\n");

    const eventPayload: any = {
      summary: requestRow.request_title,
      description,
      start: {
        dateTime: new Date(
          `${requestRow.date}T${requestRow.start_time}:00`
        ).toISOString(),
      },
      end: {
        dateTime: new Date(
          `${requestRow.date}T${requestRow.end_time}:00`
        ).toISOString(),
      },
    };

    if (isLauren) {
      eventPayload.attendees = [{ email: process.env.LAUREN_EMAIL! }];
    }

    const eventResult = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID!,
      requestBody: eventPayload,
    });

    const { error: updateError } = await supabase
      .from("requests")
      .update({
        status: "approved",
        calendar_event_id: eventResult.data.id || null,
      })
      .eq("id", requestId);

    if (updateError) {
      return NextResponse.json(
        {
          success: false,
          message: "Event was created, but request update failed.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      invitedLauren: isLauren,
    });
  } catch (error) {
    console.error("APPROVE REQUEST ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create calendar event." },
      { status: 500 }
    );
  }
}