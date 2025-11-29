"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchSentimentData, SentimentPoint } from "@/lib/fetchSentiment";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const COLORS = ["#4ade80", "#facc15", "#f87171"];

const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  name,
}: any) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={13}
      fontWeight="bold"
    >
      {`${name} ${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const Skeleton = () => (
  <motion.div
    key="skeleton"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.6 }}
    className="w-full flex flex-col items-center justify-center gap-6 p-8"
  >
    <div className="animate-pulse flex flex-col items-center gap-4">
      <div className="h-40 w-40 bg-gray-200 rounded-full" />
      <div className="h-6 w-48 bg-gray-200 rounded-lg" />
    </div>
    <div className="animate-pulse h-64 w-full bg-gray-200 rounded-lg" />
  </motion.div>
);

const SentimentCharts = ({
  sentimentData,
  latest,
  chartData,
}: {
  sentimentData: SentimentPoint[];
  latest: SentimentPoint | null;
  chartData: any[];
}) => (
  <motion.div
    key="charts"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.6 }}
    className="w-full flex flex-col items-center gap-8"
  >
    <div className="flex flex-col items-center">
      <div className="w-[300px] h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              labelLine={false}
              label={renderCustomizedLabel}
              isAnimationActive={true}
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      {latest && (
        <p className="text-gray-700 font-semibold mt-2">{latest.time}</p>
      )}
    </div>

    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={sentimentData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
          <XAxis dataKey="time" stroke="#888" />
          <YAxis />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="positive"
            stroke="#4ade80"
            strokeWidth={2}
            isAnimationActive={false}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="neutral"
            stroke="#facc15"
            strokeWidth={2}
            isAnimationActive={false}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="negative"
            stroke="#f87171"
            strokeWidth={2}
            isAnimationActive={false}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </motion.div>
);

export default function Home() {
  const [inputValue, setInputValue] = useState("");
  const [channel, setChannel] = useState("");
  const [sentimentData, setSentimentData] = useState<SentimentPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasData, setHasData] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!channel) return;

    const load = async (isInitial = false) => {
      try {
        if (isInitial) setIsLoading(true);
        
        const { timeline } = await fetchSentimentData(channel);

        setSentimentData((prev) => {
          if (JSON.stringify(prev) !== JSON.stringify(timeline)) {
             return timeline;
          }
          return prev;
        });

        if (isInitial) setHasData(true);
      } catch (err) {
        console.error("데이터 갱신 오류:", err);
      } finally {
        if (isInitial) setIsLoading(false);
      }
    };

    load(true);

    intervalRef.current = setInterval(() => load(false), 60000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [channel]);

  const handleStart = () => {
    if (!inputValue.trim()) return;
    setChannel(inputValue.trim());
    setSentimentData([]);
    setHasData(false);
  };

  const handleStop = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setChannel("");
    setHasData(false); 
  };

  const latest =
    sentimentData.length > 0 ? sentimentData[sentimentData.length - 1] : null;

  const chartData = latest
    ? [
        { name: "긍정", value: latest.positive },
        { name: "중립", value: latest.neutral },
        { name: "부정", value: latest.negative },
      ]
    : [];

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-10 relative overflow-hidden">
      
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-0 w-full max-w-4xl"
      >
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-black mb-3">
            실시간 감성 분석
          </h1>
          <p className="text-gray-600 text-lg">
            1분마다 새 데이터가 갱신됩니다.
          </p>
        </div>

        <motion.div
           className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-2xl p-8 mb-8 border border-white/20"
        >
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="채널 ID를 입력하세요"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-1 border-2 border-gray-200 rounded-xl p-4 text-lg outline-none"
              disabled={!!channel}
            />
            {!channel ? (
              <button
                onClick={handleStart}
                className="bg-blue-500 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-600 transition-all"
              >
                분석 시작
              </button>
            ) : (
              <button
                onClick={handleStop}
                className="bg-red-500 text-white px-8 py-4 rounded-xl font-semibold hover:bg-red-600 transition-all"
              >
                분석 중단
              </button>
            )}
          </div>
          {channel && (
             <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                분석 중: <span className="font-semibold text-green-500">{channel}</span>
             </div>
          )}
        </motion.div>

        <motion.div
          layout
          className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20"
        >
          <AnimatePresence mode="wait">
            {!hasData ? (
              <Skeleton key="skeleton" />
            ) : (
              <SentimentCharts 
                key="charts" 
                sentimentData={sentimentData} 
                latest={latest} 
                chartData={chartData} 
              />
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </main>
  );
}