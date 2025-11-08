package com.example.DEVs.service;

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
public class PyAnalService {

    private static final String SCRIPT_PATH =
            "C:/Users/jjs_0/Desktop/youtuber-helper/sentimentAnalyzer/main.py";
    private static final String RESULT_PATH =
            "C:/Users/jjs_0/Desktop/youtuber-helper/back-end/sentiment_result.json";

    public Sentiment runSentimentAnalyzer(String videoId, long collectStartTime) throws Exception {

        List<String> cmd = new ArrayList<>();
        String analyzeTime = new YouTubeHtmlParser().formatTime(collectStartTime);
        cmd.add("python");
        cmd.add(SCRIPT_PATH);
        cmd.add("--where");
        String where = String.format(
                "video_id = '%s' AND published_at >= '%s'",
                videoId,
                analyzeTime
        );
        cmd.add(where);

        ProcessBuilder pb = new ProcessBuilder(cmd);
        pb.redirectErrorStream(true);
        Process process = pb.start();

        BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
        System.out.println(cmd);

        int exitCode = process.waitFor();
        if (exitCode != 0) {
            throw new RuntimeException("Python script failed. exit code=" + exitCode);
        }

        ObjectMapper mapper = new ObjectMapper();
        JsonNode root = mapper.readTree(new File(RESULT_PATH));

        JsonNode analyses = root.path("analyses");
        JsonNode latest = analyses.get(analyses.size() - 1);
        JsonNode sentiment = latest.path("sentiment_summary");

        Sentiment sentimentEntity = new Sentiment();
        sentimentEntity.setVideoId(videoId);
        sentimentEntity.setTotalMessages(latest.path("total_messages").asInt());
        sentimentEntity.setPositive(sentiment.path("positive").asDouble());
        sentimentEntity.setNegative(sentiment.path("negative").asDouble());
        sentimentEntity.setNeutral(sentiment.path("neutral").asDouble());
        sentimentEntity.setTimeline(analyzeTime);

        return sentimentEntity;
    }
}


