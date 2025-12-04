"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileVideo,
  Play,
  CheckCircle,
  TrendingUp,
  Clock,
  Sparkles,
  Loader2,
  Film,
  X,
  RotateCcw,
  MessageSquareQuote,
} from "lucide-react";

interface HighlightData {
  id: number;
  startTime: string;
  endTime: string;
  positiveRate: number;
  viewerIncrease: number;
  summary: string;
  videoUrl?: string;
}

function parseTimeToSeconds(timeStr: string): number {
  const parts = timeStr.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

export default function HighlightsPage() {
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [highlights, setHighlights] = useState<HighlightData[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [playingId, setPlayingId] = useState<number | null>(null);

  const isResultMode = isAnalyzing || highlights.length > 0;

  const filePreviewUrl = useMemo(() => {
    if (uploadFile) return URL.createObjectURL(uploadFile);
    return null;
  }, [uploadFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
      setHighlights([]);
      setPlayingId(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploadFile(e.dataTransfer.files[0]);
      setHighlights([]);
      setPlayingId(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleReset = () => {
    setUploadFile(null);
    setHighlights([]);
    setPlayingId(null);
    setIsAnalyzing(false);
  };

  const processVideoAnalysis = async () => {
    if (!uploadFile) return;
    setIsAnalyzing(true);
    setHighlights([]);
    setPlayingId(null);

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

    try {
      if (!backendUrl)
        throw new Error("환경변수 NEXT_PUBLIC_BACKEND_URL 미설정");

      const formData = new FormData();
      formData.append("video", uploadFile);

      const savedChannelId = localStorage.getItem("savedChannelId");
      if (savedChannelId) {
        formData.append("channelId", savedChannelId);
      }

      const res = await fetch(`${backendUrl}/API/video/analyze`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorMsg = await res.text();
        throw new Error(`분석 요청 실패: ${errorMsg || res.statusText}`);
      }

      const data = await res.json();

      if (data.highlights && Array.isArray(data.highlights)) {
        setHighlights(data.highlights);
      } else if (Array.isArray(data)) {
        setHighlights(data);
      } else {
        setHighlights([]);
      }
    } catch (error) {
      console.error(error);
      alert("영상 분석에 실패했습니다.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div
      className="min-h-screen p-6 md:p-10 relative overflow-x-hidden flex flex-col items-center"
      style={{ scrollbarGutter: "stable" }}
    >
      <div className="w-full max-w-[1800px] flex flex-col gap-8 mb-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-5xl font-bold text-black mb-3">
            AI 하이라이트 분석
          </h1>
          <p className="text-gray-600 ml-1">
            방송 영상을 업로드하면 시청자 반응이 폭발적인 순간을 자동으로
            찾아냅니다.
          </p>
        </div>
      </div>

      <motion.div
        layout
        className="relative w-full max-w-[1800px] grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[600px]"
      >
        {!isResultMode && (
          <section className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-6 h-full flex flex-col">
              <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
                <Film className="w-5 h-5 text-gray-500" />
                영상 업로드
              </h2>
              <div className="flex-1 flex flex-col gap-4">
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={`
                    flex-1 min-h-[250px] border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all duration-300
                    ${
                      isDragOver
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-300 hover:border-purple-400 bg-gray-50/50"
                    }
                  `}
                >
                  <input
                    type="file"
                    id="video-upload"
                    accept="video/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <AnimatePresence mode="wait">
                    {uploadFile ? (
                      <motion.div
                        key="file-uploaded"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex flex-col items-center w-full px-2"
                      >
                        <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-4 relative group shrink-0">
                          <FileVideo className="w-10 h-10 text-purple-600" />
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              setUploadFile(null);
                              setHighlights([]);
                            }}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <p className="font-bold text-gray-800 text-lg w-full text-center break-all px-2 mb-1">
                          {uploadFile.name}
                        </p>
                        <p className="text-sm text-gray-500 mb-6 bg-gray-200 px-3 py-1 rounded-full shrink-0">
                          {(uploadFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>

                        <button
                          onClick={processVideoAnalysis}
                          disabled={isAnalyzing}
                          className={`
                            w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 text-white shrink-0
                            bg-gradient-to-r from-purple-600 to-indigo-600 hover:scale-[1.02]
                          `}
                        >
                          <Sparkles className="w-5 h-5" /> 분석 시작
                        </button>
                      </motion.div>
                    ) : (
                      <label
                        htmlFor="video-upload"
                        className="cursor-pointer flex flex-col items-center w-full h-full justify-center group"
                      >
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-purple-100 transition-colors">
                          <Upload className="w-10 h-10 text-gray-400 group-hover:text-purple-500 transition-colors" />
                        </div>
                        <p className="text-gray-700 font-bold text-lg">
                          영상을 드래그하거나 선택하세요
                        </p>
                      </label>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </section>
        )}

        <section
          className={`${
            isResultMode ? "lg:col-span-12" : "lg:col-span-8"
          } h-full transition-all duration-500 ease-in-out`}
        >
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-6 h-full flex flex-col min-h-[500px]">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                분석 리포트
              </h2>

              <div className="flex gap-3">
                {highlights.length > 0 && (
                  <span className="bg-purple-100 text-purple-700 text-sm px-3 py-1.5 rounded-full font-bold shadow-sm flex items-center">
                    {highlights.length}개 장면
                  </span>
                )}
                {isResultMode && (
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-1.5 rounded-full text-sm font-bold transition-colors"
                    disabled={isAnalyzing}
                  >
                    <RotateCcw className="w-4 h-4" />
                    새로운 영상 분석
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {highlights.length === 0 && !isAnalyzing && (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60 py-20">
                  <Sparkles className="w-16 h-16 mb-4 text-gray-300" />
                  <p className="text-lg font-medium">
                    아직 분석된 데이터가 없습니다.
                  </p>
                </div>
              )}

              {isAnalyzing && (
                <div className="flex flex-col items-center justify-center h-full py-20 space-y-6">
                  <Loader2 className="w-16 h-16 text-purple-600 animate-spin" />
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      AI가 영상을 분석하고 있습니다
                    </h3>
                    <p className="text-gray-500">잠시만 기다려주세요...</p>
                  </div>
                  <div className="w-full max-w-2xl space-y-4 opacity-50 mt-8">
                    {[1, 2].map((i) => (
                      <div
                        key={i}
                        className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm animate-pulse flex gap-5"
                      >
                        <div className="w-32 h-24 bg-gray-200 rounded-xl" />
                        <div className="flex-1 space-y-3 py-1">
                          <div className="h-4 bg-gray-200 rounded w-1/4" />
                          <div className="h-4 bg-gray-200 rounded w-3/4" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <AnimatePresence>
                <div className="flex flex-col gap-6">
                  {highlights.map((item, index) => {
                    const isPlaying = playingId === item.id;
                    const startSec = parseTimeToSeconds(item.startTime);
                    const endSec = parseTimeToSeconds(item.endTime);
                    const videoSrc = item.videoUrl
                      ? item.videoUrl
                      : filePreviewUrl
                      ? `${filePreviewUrl}#t=${startSec},${endSec}`
                      : "";

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className={`
                          bg-white rounded-2xl p-6 shadow-sm border transition-all group hover:shadow-lg
                          ${
                            isPlaying
                              ? "ring-2 ring-purple-500 border-purple-500"
                              : "border-gray-100 hover:border-purple-200"
                          }
                        `}
                      >
                        <div className="flex flex-col md:flex-row gap-6 items-start">
                          <div className="w-full md:w-60 aspect-video bg-gray-900 rounded-xl relative overflow-hidden shrink-0 shadow-inner">
                            {isPlaying && videoSrc ? (
                              <video
                                src={videoSrc}
                                controls
                                autoPlay
                                className="w-full h-full object-contain bg-black"
                                onEnded={() => setPlayingId(null)}
                              />
                            ) : (
                              <div
                                onClick={() => setPlayingId(item.id)}
                                className="w-full h-full flex items-center justify-center cursor-pointer group/play"
                              >
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                <div className="relative z-10 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover/play:bg-white/30 transition-all group-hover/play:scale-110">
                                  <Play
                                    className="text-white w-6 h-6 ml-1"
                                    fill="white"
                                  />
                                </div>
                                <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs font-medium px-2 py-1 rounded-md backdrop-blur-sm">
                                  {item.endTime}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex-1 flex flex-col justify-between py-1 h-full">
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <span className="bg-blue-50 text-blue-600 text-sm font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 border border-blue-100">
                                  <Clock className="w-4 h-4" />
                                  {item.startTime} ~ {item.endTime}
                                </span>
                                {isPlaying && (
                                  <span className="text-purple-600 text-sm font-bold animate-pulse flex items-center gap-1.5">
                                    <span className="relative flex h-3 w-3">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                                    </span>
                                    재생 중
                                  </span>
                                )}
                              </div>

                              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-3 h-24 overflow-y-auto custom-scrollbar">
                                <div className="flex gap-2 items-start">
                                  <MessageSquareQuote className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                                  <p className="text-gray-700 font-medium text-base leading-relaxed break-keep">
                                    {item.summary}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-3 text-sm">
                              <div className="flex items-center gap-1.5 text-green-700 font-bold bg-green-50 px-4 py-2 rounded-xl border border-green-100">
                                <CheckCircle className="w-4 h-4" />
                                긍정 반응 {item.positiveRate}%
                              </div>
                              <div className="flex items-center gap-1.5 text-red-600 font-bold bg-red-50 px-4 py-2 rounded-xl border border-red-100">
                                <TrendingUp className="w-4 h-4" />
                                채팅량 급증 +{item.viewerIncrease}%
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </AnimatePresence>
            </div>
          </div>
        </section>
      </motion.div>
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #e5e7eb;
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #d1d5db;
        }
      `}</style>
    </div>
  );
}
