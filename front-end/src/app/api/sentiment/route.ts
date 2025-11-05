import { NextResponse } from "next/server";

const sessionData: Record<string, any[]> = {};

function generatePoint(index: number) {
  return {
    time: `00:${String(index * 1).padStart(2, "0")}`,
    positive: Math.floor(Math.random() * 40) + 30,
    neutral: Math.floor(Math.random() * 20) + 20,
    negative: Math.floor(Math.random() * 30) + 10,
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const channelId = searchParams.get("channelId");

  if (!channelId) {
    return NextResponse.json(
      { error: "채널 ID가 필요합니다." },
      { status: 400 }
    );
  }

  if (!sessionData[channelId]) sessionData[channelId] = [];

  const currentData = sessionData[channelId];
  const newIndex = currentData.length;

  const newPoint = generatePoint(newIndex);

  currentData.push(newPoint);

  await new Promise((res) => setTimeout(res, 1000));

  return NextResponse.json(currentData);
}
