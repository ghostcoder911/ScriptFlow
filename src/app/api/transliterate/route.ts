import { NextResponse } from "next/server";
import { localPhrase } from "@/lib/transliterate";

export const runtime = "nodejs";

type GoogleResponse = [string, [string, string[], unknown[], unknown][]];

async function googleTransliterate(text: string): Promise<string[]> {
  const url = new URL("https://inputtools.google.com/request");
  url.searchParams.set("text", text);
  url.searchParams.set("itc", "ml-t-i0-und");
  url.searchParams.set("num", "8");
  url.searchParams.set("cp", "0");
  url.searchParams.set("cs", "1");
  url.searchParams.set("ie", "utf-8");
  url.searchParams.set("oe", "utf-8");
  url.searchParams.set("app", "scriptflow");

  const res = await fetch(url, {
    headers: { accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) return [];
  const data = (await res.json()) as GoogleResponse;
  if (!Array.isArray(data) || data[0] !== "SUCCESS") return [];
  const entry = data[1]?.[0];
  if (!entry) return [];
  return (entry[1] || []).map((s) => s.replace(/\u200c/g, "").trim()).filter(Boolean);
}

export async function POST(request: Request) {
  let text = "";
  try {
    const body = (await request.json()) as { text?: string };
    text = String(body.text || "").trim();
  } catch {
    return NextResponse.json({ suggestions: [] }, { status: 400 });
  }
  if (!text) return NextResponse.json({ suggestions: [] });

  const local = localPhrase(text, false);
  try {
    const google = await googleTransliterate(text);
    const suggestions = [...google];
    if (local && !suggestions.includes(local)) suggestions.push(local);
    return NextResponse.json({
      suggestions,
      source: google.length ? "google" : "local",
    });
  } catch {
    return NextResponse.json({ suggestions: local ? [local] : [], source: "local" });
  }
}
