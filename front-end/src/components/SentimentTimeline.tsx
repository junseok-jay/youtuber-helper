"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface TimelineData {
  time: string;
  positive: number;
  neutral: number;
  negative: number;
}

export default function SentimentTimeline({ timeline }: { timeline: TimelineData[] }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-md">
      <h2 className="text-lg font-semibold mb-4 text-center">시간대별 감정 변화</h2>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={timeline}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="positive" stroke="#4ade80" name="긍정" />
            <Line type="monotone" dataKey="neutral" stroke="#facc15" name="보통" />
            <Line type="monotone" dataKey="negative" stroke="#f87171" name="부정" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}