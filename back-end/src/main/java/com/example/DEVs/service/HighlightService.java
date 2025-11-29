package com.example.DEVs.service;

import com.example.DEVs.dto.HighlightDataDto;
import com.example.DEVs.entity.Highlight;
import com.example.DEVs.entity.Sentiment;
import com.example.DEVs.repository.HighlightRepository;
import com.example.DEVs.repository.SentimentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;

@Service
@RequiredArgsConstructor
public class HighlightService {

    // 원본 영상 저장 경로
    private static final String VIDEO_BASE_PATH = ".\\videos\\";
    // 클립 저장 경로
    private static final String CLIP_OUTPUT_PATH = ".\\videos\\highlights\\";

    private final HighlightRepository highlightRepository;
    private final SentimentRepository sentimentRepository;
    private final PyAnalyzeService pyAnalyzeService;

    public List<HighlightDataDto> highlightVideo(MultipartFile videoFile, String videoId) throws Exception{
        Files.createDirectories(Paths.get(VIDEO_BASE_PATH));

        Path filePath = Path.of(VIDEO_BASE_PATH, videoId + ".mp4");

        Files.copy(videoFile.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        if(!highlightRepository.existsByVideoId(videoId)){
            extractHighlight(videoId);
            cutHighlightVideos(videoId);
        }
        return loadHighlightTimeline(videoId);
    }

    public void extractHighlight(String videoId){
        List<Sentiment> sentimentStream = sentimentRepository.findAllByVideoId(videoId);
        Sentiment curr = sentimentStream.remove(0);

        for (Sentiment s : sentimentStream) {
            Sentiment prev = curr;
            curr = s;

            double prevMsg = prev.getTotalMessages();
            double currMsg = curr.getTotalMessages();

            if (prevMsg == 0) continue;

            double increaseRate = (currMsg - prevMsg) / prevMsg;

            boolean positiveHigh = curr.getPositive() >= 50.0;
            boolean increased30 = increaseRate >= 0.30;

            if (positiveHigh || increased30) {

                Highlight h = new Highlight();
                h.setVideoId(videoId);

                h.setStartTime(prev.getTimeline());   // 00:05:00
                h.setEndTime(curr.getTimeline());     // 00:06:00

                h.setPositive(curr.getPositive());
                h.setTotalMessages(curr.getTotalMessages());
                h.setIncreaseRate(Math.round(increaseRate * 100) / 100.0);

                highlightRepository.save(h);
            }
        }
    }

    public void cutHighlightVideos(String videoId) throws Exception {

        List<Highlight> highlights = highlightRepository.findByVideoId(videoId);

        String inputVideoPath = VIDEO_BASE_PATH + videoId + ".mp4";
        String OutputFolder = CLIP_OUTPUT_PATH + videoId + "\\";

        Files.createDirectories(Paths.get(OutputFolder));

        for (Highlight h : highlights) {

            String start = h.getStartTime(); // "HH:mm:ss"
            String end = h.getEndTime();     // "HH:mm:ss"

            String outputFileName = videoId + "_" + start.replace(":", "") + "-" +
                    end.replace(":", "") + ".mp4";

            String outputPath = OutputFolder + outputFileName;

            if (!highlightRepository.existsByVideoUrl(outputPath)) {
                runFfmpegCut(inputVideoPath, start, end, outputPath);
                String highlightPath = "..\\back-end" + outputPath.substring(1);
                String summary = pyAnalyzeService.runHighlightVideo(highlightPath);
                h.setSummary(summary);
            }
            h.setVideoUrl(outputPath.substring(1));

            highlightRepository.save(h);
        }
    }

    private void runFfmpegCut(String input, String start, String end, String output)
            throws IOException, InterruptedException {

        ProcessBuilder pb = new ProcessBuilder(
                "ffmpeg",
                "-i", input,
                "-ss", start,
                "-to", end,
                "-c", "copy",
                output
        );

        pb.redirectErrorStream(true);
        Process process = pb.start();

        // ffmpeg 로그 읽기 (원할 경우)
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                System.out.println("[FFMPEG] " + line);
            }
        }

        int exitCode = process.waitFor();
        if (exitCode != 0) {
            throw new RuntimeException("FFmpeg process failed. code=" + exitCode);
        }
    }

    public List<HighlightDataDto> loadHighlightTimeline(String videoId) {

        List<Highlight> highlights =
                highlightRepository.findAllByVideoIdOrderByStartTime(videoId);

        return highlights.stream()
                .map(h -> HighlightDataDto.builder()
                        .id(h.getId())
                        .startTime(h.getStartTime())    // ISO-8601
                        .endTime(h.getEndTime())
                        .positiveRate(h.getPositive())
                        .viewerIncrease(h.getIncreaseRate())
                        .summary(h.getSummary())
                        .videoUrl(String.format("/videos/%s/%d.mp4", videoId, h.getId()))
                        .build()
                )
                .toList();
    }

}
