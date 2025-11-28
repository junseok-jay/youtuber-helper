"use client";

import React, { useState } from "react";
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

export default function HighlightsPage() {
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [highlights, setHighlights] = useState<HighlightData[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const processVideoAnalysis = async () => {
    if (!uploadFile) return;
    setIsAnalyzing(true);
    setHighlights([]);

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

    try {
      if (!backendUrl) {
        throw new Error(
          "환경변수 NEXT_PUBLIC_BACKEND_URL이 설정되지 않았습니다."
        );
      }

      console.log("🌐 Real API Mode: 영상 업로드 및 분석 요청 중...");

      const formData = new FormData();
      formData.append("video", uploadFile);

      const savedChannelId = localStorage.getItem("savedChannelId");

      if (savedChannelId) {
        formData.append("channelId", savedChannelId);
        console.log("Channel ID added:", savedChannelId);
      } else {
        console.warn("⚠️ 저장된 채널 ID가 없습니다. 영상만 전송합니다.");
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

      setHighlights(data.highlights || []);
    } catch (error) {
      console.error("영상 분석 중 오류 발생:", error);
      alert("영상 분석에 실패했습니다. 백엔드 연결 상태를 확인해주세요.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-10 relative overflow-hidden flex flex-col items-center">

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-6xl flex flex-col gap-8"
      >
        <div className="flex flex-col gap-2 mb-4">
          <h1 className="text-5xl font-bold text-black mb-3">
            AI 하이라이트 분석
          </h1>
          <p className="text-gray-600 ml-1">
            방송 영상을 업로드하면 시청자 반응이 폭발적인 순간을
            자동으로 찾아냅니다.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[600px]">
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
                        ? "border-purple-500 bg-purple-50 scale-[1.02]"
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
                        className="flex flex-col items-center w-full"
                      >
                        <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-4 relative group">
                          <FileVideo className="w-10 h-10 text-purple-600" />
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              setUploadFile(null);
                            }}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                        <p className="font-bold text-gray-800 truncate max-w-[90%] text-lg">
                          {uploadFile.name}
                        </p>
                        <p className="text-sm text-gray-500 mt-1 mb-6 bg-gray-200 px-3 py-1 rounded-full">
                          {(uploadFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>

                        <button
                          onClick={processVideoAnalysis}
                          disabled={isAnalyzing}
                          className={`
                            w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 text-white
                            ${
                              isAnalyzing
                                ? "bg-gray-400 cursor-wait"
                                : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:scale-[1.02] hover:shadow-purple-500/30"
                            }
                          `}
                        >
                          {isAnalyzing ? (
                            <>
                              <Loader2 className="animate-spin w-5 h-5" />
                              분석 진행 중...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-5 h-5" />
                              분석 시작
                            </>
                          )}
                        </button>
                      </motion.div>
                    ) : (
                      <motion.label
                        key="upload-placeholder"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        htmlFor="video-upload"
                        className="cursor-pointer flex flex-col items-center w-full h-full justify-center group"
                      >
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-purple-100 transition-colors">
                          <Upload className="w-10 h-10 text-gray-400 group-hover:text-purple-500 transition-colors" />
                        </div>
                        <p className="text-gray-700 font-bold text-lg">
                          영상을 드래그하거나 선택하세요
                        </p>
                        <p className="text-sm text-gray-400 mt-2">
                          MP4, MOV, AVI (최대 2GB)
                        </p>
                      </motion.label>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </section>

          <section className="lg:col-span-8 h-full">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-6 h-full flex flex-col min-h-[500px]">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  분석 리포트
                </h2>
                {highlights.length > 0 && (
                  <span className="bg-purple-100 text-purple-700 text-sm px-3 py-1.5 rounded-full font-bold shadow-sm">
                    {highlights.length}개의 주요 장면 발견
                  </span>
                )}
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {highlights.length === 0 && !isAnalyzing && (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60 py-20">
                    <Sparkles className="w-16 h-16 mb-4 text-gray-300" />
                    <p className="text-lg font-medium">
                      아직 분석된 데이터가 없습니다.
                    </p>
                    <p className="text-sm mt-2">
                      왼쪽에서 영상을 업로드하여 분석을 시작해보세요.
                    </p>
                  </div>
                )}

                {isAnalyzing && (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm animate-pulse flex gap-5"
                      >
                        <div className="w-32 h-24 bg-gray-200 rounded-xl" />
                        <div className="flex-1 space-y-3 py-1">
                          <div className="h-4 bg-gray-200 rounded w-1/4" />
                          <div className="h-4 bg-gray-200 rounded w-3/4" />
                          <div className="h-4 bg-gray-200 rounded w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <AnimatePresence>
                  <div className="space-y-4">
                    {highlights.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all group hover:border-purple-200"
                      >
                        <div className="flex flex-col sm:flex-row gap-5">
                          {/* 썸네일, 없으면 제거 */}
                          <div className="w-full sm:w-40 h-28 bg-gray-900 rounded-xl flex items-center justify-center flex-shrink-0 relative overflow-hidden cursor-pointer group-hover:ring-2 ring-purple-400 ring-offset-2 transition-all">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <Play className="text-white w-10 h-10 opacity-80 group-hover:scale-110 transition-transform relative" />
                            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs font-medium px-1.5 py-0.5 rounded backdrop-blur-sm">
                              00:30
                            </div>
                          </div>

                          <div className="flex-1 flex flex-col justify-between py-1">
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <span className="bg-blue-50 text-blue-600 text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 border border-blue-100">
                                  <Clock className="w-3.5 h-3.5" />
                                  {item.startTime} ~ {item.endTime}
                                </span>
                              </div>

                              <p className="text-gray-700 font-medium text-base leading-relaxed mb-3">
                                {item.summary}
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-3 text-sm">
                              <div className="flex items-center gap-1.5 text-green-700 font-semibold bg-green-50 px-3 py-1.5 rounded-lg border border-green-100">
                                <CheckCircle className="w-4 h-4" />
                                긍정 {item.positiveRate}%
                              </div>
                              <div className="flex items-center gap-1.5 text-red-600 font-semibold bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
                                <TrendingUp className="w-4 h-4" />
                                채팅량 +{item.viewerIncrease}%
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </AnimatePresence>
              </div>
            </div>
          </section>
        </div>
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
        @keyframes blob {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
}
