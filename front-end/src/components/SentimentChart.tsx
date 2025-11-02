"use client";

import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";

interface SentimentData {
  positive: number;
  neutral: number;
  negative: number;
}

export default function SentimentChart({ data }: { data: SentimentData }) {
  const chartData = [
    { name: "긍정", value: data.positive },
    { name: "보통", value: data.neutral },
    { name: "부정", value: data.negative },
  ];

  const COLORS = ["#4ade80", "#facc15", "#f87171"]; // 초록, 노랑, 빨강

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md">
      <h2 className="text-lg font-semibold mb-4 text-center">감정 비율</h2>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              outerRadius={120}
              fill="#8884d8"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index]} />
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
