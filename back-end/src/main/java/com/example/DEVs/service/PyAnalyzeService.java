package com.example.DEVs.service;

import com.example.DEVs.entity.Highlight;
import com.example.DEVs.entity.Sentiment;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PyAnalyzeService {

    private static final String PYTHON_MODULE_PATH = "../python_modules";

    private static final String TEXT_ANALYZE_PATH = "../python_modules/sentimentAnalyzer/main.py";
    private static final String TEXT_RESULT_PATH = "../python_modules/sentiment_result.json";

    private static final String VIDEO_ANALYZE_PATH = "../python_modules/videoAnalyzer/run_videoAnalyzer.py";
    private static final String VIDEO_RESULT_PATH = "../python_modules/video_analysis_result.json";

    public Sentiment runSentimentAnalyzer(String videoId, long collectStartTime) throws Exception {

        List<String> cmd = new ArrayList<>();
        String analyzeTime = formatTime(collectStartTime);
        String endTime = formatTime(collectStartTime + 60_000);
        cmd.add("uv");
        cmd.add("run");
        cmd.add("python");
        cmd.add(TEXT_ANALYZE_PATH);
        cmd.add("--where");
        String where = String.format(
                "video_id = '%s' AND published_at >= '%s'",
                videoId,
                analyzeTime
        );
        cmd.add(where);

        ProcessBuilder pb = new ProcessBuilder(cmd);
        pb.directory(new File(PYTHON_MODULE_PATH));
        pb.redirectErrorStream(true);
        Process process = pb.start();

        System.out.println(cmd);

        int exitCode = process.waitFor();
        if (exitCode != 0) {
            throw new RuntimeException("Python script failed. exit code=" + exitCode);
        }

        ObjectMapper mapper = new ObjectMapper();
        JsonNode root = mapper.readTree(new File(TEXT_RESULT_PATH));

        JsonNode analyses = root.path("analyses");
        JsonNode latest = analyses.get(analyses.size() - 1);
        JsonNode sentiment = latest.path("sentiment_summary");

        Sentiment s = new Sentiment();
        s.setVideoId(videoId);
        s.setTotalMessages(latest.path("total_messages").asInt());
        s.setPositive(sentiment.path("positive").asDouble());
        s.setNegative(sentiment.path("negative").asDouble());
        s.setNeutral(sentiment.path("neutral").asDouble());
        s.setTimeline(analyzeTime);
        s.setEndTime(endTime);

        return s;
    }

    public String runHighlightVideo(String videoPath) throws Exception {
        List<String> cmd = new ArrayList<>();
        cmd.add("uv");
        cmd.add("run");
        cmd.add("python");
        cmd.add(VIDEO_ANALYZE_PATH);
        cmd.add("--file");
        cmd.add(videoPath);

        ProcessBuilder pb = new ProcessBuilder(cmd);
        pb.directory(new File(PYTHON_MODULE_PATH));
        pb.redirectErrorStream(true);
        Process process = pb.start();

        BufferedReader br = new BufferedReader(new InputStreamReader(process.getInputStream()));
        for (String line; (line = br.readLine()) != null; ) {
            System.out.println(line);
        }


        int exitCode = process.waitFor();
        if (exitCode != 0) {
            throw new RuntimeException("Python script failed. exit code=" + exitCode);
        }



        ObjectMapper mapper = new ObjectMapper();
        JsonNode root = mapper.readTree(new File(VIDEO_RESULT_PATH));
        JsonNode analyses = root.path("analyses");
        JsonNode highlight = analyses.get(analyses.size() - 1)
                .path("analysis_result")
                .path("summary");

        return highlight.asText();
    }

    public String formatTime(long ms) {
        long hh = ms / 3600_000;
        long mm = (ms % 3600_000) / 60_000;
        long ss = (ms % 60_000) / 1000;
        return String.format("%02d:%02d:%02d", hh, mm, ss);
    }
}


