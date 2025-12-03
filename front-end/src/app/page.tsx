"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchSentimentData, SentimentPoint } from "@/lib/fetchSentiment";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";
import {
  Activity,
  Smile,
  Meh,
  Frown,
  TrendingUp,
  Search,
  StopCircle,
} from "lucide-react";

const COLORS = ["#4ade80", "#facc15", "#f87171"];

const StatCard = ({ title, value, subtext, icon: Icon, color }: any) => (
  <div className="bg-white rounded-2xl p-6 shadow-lg flex items-center justify-between border border-gray-100">
    <div>
      <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
      <h3 className="text-3xl font-bold text-gray-800">{value}</h3>
      {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
    </div>
    <div className={`p-4 rounded-full ${color} text-white shadow-md`}>
      <Icon size={24} />
    </div>
  </div>
);

const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: any) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.45;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={16}
      fontWeight="bold"
      style={{ textShadow: "0px 1px 3px rgba(0,0,0,0.3)" }}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const SkeletonDashboard = () => (
  <motion.div
    key="skeleton"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="w-full flex flex-col gap-6"
  >
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-32 bg-gray-200/50 rounded-2xl animate-pulse" />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[500px]">
      <div className="lg:col-span-5 bg-gray-200/50 rounded-2xl animate-pulse h-full" />
      <div className="lg:col-span-7 bg-gray-200/50 rounded-2xl animate-pulse h-full" />
    </div>
  </motion.div>
);

const DashboardContent = ({
  sentimentData,
  latest,
  chartData,
}: {
  sentimentData: SentimentPoint[];
  latest: SentimentPoint;
  chartData: any[];
}) => {
  const maxSentiment = Object.entries({
    긍정: latest.positive,
    중립: latest.neutral,
    부정: latest.negative,
  }).reduce((a, b) => (a[1] > b[1] ? a : b));

  return (
    <motion.div
      key="dashboard"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col gap-6 w-full"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="실시간 주된 반응"
          value={maxSentiment[0]}
          subtext={`점유율 ${maxSentiment[1]}%`}
          icon={TrendingUp}
          color="bg-blue-500"
        />
        <StatCard
          title="긍정 지수"
          value={`${latest.positive}%`}
          subtext="전분 대비 변동 없음"
          icon={Smile}
          color="bg-green-400"
        />
        <StatCard
          title="중립 지수"
          value={`${latest.neutral}%`}
          subtext="일반적인 대화 흐름"
          icon={Meh}
          color="bg-yellow-400"
        />
        <StatCard
          title="부정 지수"
          value={`${latest.negative}%`}
          subtext="주의가 필요한 구간"
          icon={Frown}
          color="bg-red-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto lg:h-[500px]">
        <div className="lg:col-span-5 bg-white rounded-3xl p-8 shadow-xl flex flex-col items-center justify-center relative border border-gray-100">
          <h3 className="text-xl font-bold text-gray-700 absolute top-8 left-8 flex items-center gap-2">
            <Activity className="w-5 h-5 text-gray-400" />
            현재 감정 분포
          </h3>
          <div className="w-full h-[350px] mt-8">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  labelLine={false}
                  label={renderCustomizedLabel}
                  paddingAngle={5}
                >
                  {chartData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index]}
                      stroke="rgba(255,255,255,0.8)"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="absolute bottom-8 text-center">
            <p className="text-gray-400 text-sm">Last Update</p>
            <p className="text-xl font-bold text-gray-800 font-mono">
              {latest.time}
            </p>
          </div>
        </div>

        <div className="lg:col-span-7 bg-white rounded-3xl p-8 shadow-xl flex flex-col border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-700 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-gray-400" />
              실시간 감정 변화 추이
            </h3>
            <div className="flex gap-4 text-sm font-medium">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-400" />
                긍정
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                중립
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                부정
              </div>
            </div>
          </div>

          <div className="flex-1 w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={sentimentData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorPos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorNeu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#facc15" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#facc15" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorNeg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f87171" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E5E7EB"
                />
                <XAxis
                  dataKey="time"
                  stroke="#9CA3AF"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#9CA3AF"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="positive"
                  stroke="#4ade80"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorPos)"
                />
                <Area
                  type="monotone"
                  dataKey="neutral"
                  stroke="#facc15"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorNeu)"
                />
                <Area
                  type="monotone"
                  dataKey="negative"
                  stroke="#f87171"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorNeg)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function Home() {
  const [inputValue, setInputValue] = useState("");
  const [channel, setChannel] = useState("");
  const [sentimentData, setSentimentData] = useState<SentimentPoint[]>([]);
  const [hasData, setHasData] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!channel) return;

    const load = async (isInitial = false) => {
      try {
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
    <main className="min-h-screen bg-white p-6 md:p-10 flex flex-col items-center">
      <div className="w-full max-w-[1600px] flex flex-col gap-8">
        <header className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="mb-4 md:mb-0">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Activity className="text-blue-600" />
              실시간 감정 분석
            </h1>
            <p className="text-gray-500 mt-1 ml-1">
              1분 단위로 대시보드가 업데이트 됩니다.
            </p>
          </div>

          <div className="flex w-full md:w-auto gap-3">
            <div className="relative flex-1 md:w-[300px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="채널 ID 입력..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-100 border-transparent focus:bg-white border focus:border-blue-500 rounded-xl outline-none transition-all"
                disabled={!!channel}
              />
            </div>

            {!channel ? (
              <button
                onClick={handleStart}
                className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 whitespace-nowrap"
              >
                분석 시작
              </button>
            ) : (
              <button
                onClick={handleStop}
                className="bg-red-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/30 flex items-center gap-2 whitespace-nowrap"
              >
                <StopCircle className="w-5 h-5" /> 분석 중단
              </button>
            )}
          </div>
        </header>

        {channel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="flex items-center gap-3 px-2"
          >
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <p className="text-gray-600 font-medium">
              현재 분석 중인 채널:{" "}
              <span className="text-black font-bold text-lg">{channel}</span>
            </p>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {!hasData ? (
            channel ? (
              <SkeletonDashboard key="skeleton" />
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-[600px] flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-300 rounded-3xl bg-white"
              >
                <Search className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-xl font-medium">
                  채널 ID를 입력하여 분석을 시작하세요
                </p>
              </motion.div>
            )
          ) : (
            <DashboardContent
              key="content"
              sentimentData={sentimentData}
              latest={latest!}
              chartData={chartData}
            />
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}