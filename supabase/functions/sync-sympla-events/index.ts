import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYMPLA_API_URL = "https://api.sympla.com.br/public/v1/events";

interface SymplaEvent {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  url: string;
  images?: { original?: string; lg?: string; xs?: string };
  location?: {
    city?: string;
    state?: string;
    address?: string;
    address_num?: string;
    name?: string;
    lat?: number;
    lon?: number;
    neighborhood?: string;
  };
  category?: { name?: string };
  tickets?: Array<{ price?: number; quantity_available?: number }>;
}

function mapCategory(symplaCategory: string | undefined): string {
  if (!symplaCategory) return "Show";
  const lower = symplaCategory.toLowerCase();
  if (lower.includes("show") || lower.includes("música") || lower.includes("musica")) return "Show";
  if (lower.includes("teatro")) return "Teatro";
  if (lower.includes("dança") || lower.includes("danca")) return "Dança";
  if (lower.includes("exposição") || lower.includes("exposicao") || lower.includes("arte")) return "Exposição";
  if (lower.includes("cinema") || lower.includes("filme")) return "Cinema";
  if (lower.includes("festival") || lower.includes("festa")) return "Festival";
  if (lower.includes("workshop") || lower.includes("oficina") || lower.includes("curso")) return "Workshop";
  if (lower.includes("palestra") || lower.includes("talk") || lower.includes("congresso")) return "Palestra";
  return "Show";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SYMPLA_API_TOKEN = Deno.env.get("SYMPLA_API_TOKEN");
    if (!SYMPLA_API_TOKEN) {
      throw new Error("SYMPLA_API_TOKEN is not configured");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Build date range: today to 90 days from now
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + 90);
    const formatDate = (d: Date) => d.toISOString().split("T")[0];
    const range = `${formatDate(today)},${formatDate(futureDate)}`;

    let allEvents: SymplaEvent[] = [];
    let page = 1;
    const limit = 50;
    let hasMore = true;

    // Fetch events from Sympla with pagination
    while (hasMore && page <= 10) {
      const params = new URLSearchParams({
        city: "Aracaju",
        state: "SE",
        range,
        page: String(page),
        limit: String(limit),
      });

      console.log(`Fetching Sympla page ${page}: ${SYMPLA_API_URL}?${params}`);

      const response = await fetch(`${SYMPLA_API_URL}?${params}`, {
        headers: {
          "s_token": SYMPLA_API_TOKEN,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Sympla API error [${response.status}]: ${errorText}`);
      }

      const data = await response.json();
      const events = data.data || [];
      allEvents = [...allEvents, ...events];

      // Check if there are more pages
      if (events.length < limit) {
        hasMore = false;
      } else {
        page++;
      }
    }

    console.log(`Total events fetched from Sympla: ${allEvents.length}`);

    let imported = 0;
    let skipped = 0;

    for (const symplaEvent of allEvents) {
      const lat = symplaEvent.location?.lat || -10.9472;
      const lon = symplaEvent.location?.lon || -37.0731;

      const startDate = symplaEvent.start_date ? symplaEvent.start_date.split(" ")[0] : formatDate(today);
      const startTime = symplaEvent.start_date ? symplaEvent.start_date.split(" ")[1]?.substring(0, 5) || "20:00" : "20:00";

      const lowestPrice = symplaEvent.tickets?.reduce((min, t) => {
        const price = t.price ?? 0;
        return price < min ? price : min;
      }, Infinity) ?? 0;
      const ticketPrice = lowestPrice === Infinity ? 0 : lowestPrice;

      const locationParts = [
        symplaEvent.location?.name,
        symplaEvent.location?.address,
        symplaEvent.location?.address_num,
        symplaEvent.location?.neighborhood,
      ].filter(Boolean);
      const locationStr = locationParts.length > 0 ? locationParts.join(", ") : "Aracaju, SE";

      const imageUrl = symplaEvent.images?.lg || symplaEvent.images?.original || symplaEvent.images?.xs || "";

      const eventData = {
        name: symplaEvent.name,
        category: mapCategory(symplaEvent.category?.name),
        attractions: symplaEvent.url || "",
        date: startDate,
        time: startTime,
        location: locationStr,
        ticket_price: ticketPrice,
        coordinates_lat: lat,
        coordinates_lng: lon,
        image_url: imageUrl,
      };

      // Upsert: check if event with same name and date already exists
      const { data: existing } = await supabase
        .from("events")
        .select("id")
        .eq("name", eventData.name)
        .eq("date", eventData.date)
        .maybeSingle();

      if (existing) {
        // Update existing
        await supabase.from("events").update(eventData).eq("id", existing.id);
        skipped++;
      } else {
        // Insert new
        const { error } = await supabase.from("events").insert([eventData]);
        if (error) {
          console.error(`Error inserting event "${eventData.name}":`, error);
        } else {
          imported++;
        }
      }
    }

    const result = {
      success: true,
      total_fetched: allEvents.length,
      imported,
      updated: skipped,
    };

    console.log("Sync result:", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error syncing Sympla events:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
