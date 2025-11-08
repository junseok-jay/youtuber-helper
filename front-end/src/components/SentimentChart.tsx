"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = ["#4ade80", "#facc15", "#f87171"];

export default function SentimentChart({
  summary,
}: {
  summary: { positive: number; neutral: number; negative: number };
}) {
  const chartData = [
    { name: "긍정", value: summary.positive },
    { name: "보통", value: summary.neutral },
    { name: "부정", value: summary.negative },
  ];

  if (!summary) {
    return <div className="text-gray-500">데이터를 불러오는 중...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md">
      <h2 className="text-lg font-semibold mb-4 text-center">감정 비율</h2>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={chartData} dataKey="value" nameKey="name" outerRadius={100} label>
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}