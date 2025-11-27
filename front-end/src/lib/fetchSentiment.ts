export interface SentimentPoint {
  time: string;
  positive: number;
  neutral: number;
  negative: number;
}

// 기존 timeline을 누적하기 위해 전역 변수 활용
let accumulatedTimeline: SentimentPoint[] = [];

export async function fetchSentimentData(channelId: string): Promise<{
  summary: { positive: number; neutral: number; negative: number };
  timeline: SentimentPoint[];
}> {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  const mockMode = process.env.NEXT_PUBLIC_MOCK_MODE === "true";

  if (mockMode) {
    // (모킹 로직은 그대로)
    const newPoint: SentimentPoint = {
      time: new Date().toLocaleTimeString().slice(3, 8),
      positive: Math.floor(Math.random() * 50) + 25,
      neutral: Math.floor(Math.random() * 30) + 20,
      negative: Math.floor(Math.random() * 40) + 10,
    };

    accumulatedTimeline = [...accumulatedTimeline, newPoint];

    const total = accumulatedTimeline.length;
    const summary = {
      positive: Math.round(accumulatedTimeline.reduce((a, b) => a + b.positive, 0) / total),
      neutral: Math.round(accumulatedTimeline.reduce((a, b) => a + b.neutral, 0) / total),
      negative: Math.round(accumulatedTimeline.reduce((a, b) => a + b.negative, 0) / total),
    };

    return { summary, timeline: accumulatedTimeline };
  }

  if (!backendUrl) throw new Error("환경변수 NEXT_PUBLIC_BACKEND_URL이 설정되지 않았습니다.");

  console.log("🌐 Real API Mode: 백엔드에서 감정 데이터 가져오는 중...");

  const res = await fetch(`${backendUrl}/youtube/live/sentiment/start?videoId=${channelId}&durationSeconds=60`, {
    method: "POST",
  });

  if (!res.ok) throw new Error("백엔드 API 요청 실패");
  const data = await res.json();

  // ✅ 단일 객체 응답을 처리
  const newPoint: SentimentPoint = {
    time: data.timeline ?? data.timestamp ?? new Date().toLocaleTimeString().slice(3, 8),
    positive: data.positive ?? data.pos ?? 0,
    neutral: data.neutral ?? data.mid ?? data.normal ?? 0,
    negative: data.negative ?? data.neg ?? 0,
  };

  // ✅ 누적
  accumulatedTimeline = [...accumulatedTimeline, newPoint];

  const total = accumulatedTimeline.length;
  const summary = {
    positive: Math.round(accumulatedTimeline.reduce((a, b) => a + b.positive, 0) / total),
    neutral: Math.round(accumulatedTimeline.reduce((a, b) => a + b.neutral, 0) / total),
    negative: Math.round(accumulatedTimeline.reduce((a, b) => a + b.negative, 0) / total),
  };

  return { summary, timeline: accumulatedTimeline };
}
