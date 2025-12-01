package com.example.DEVs.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.io.File;

public class pyAnalyzeServiceTest {

    private static final String VIDEO_RESULT_PATH = "..\\python_modules\\video_analysis_result.json";

    @Test
    public void runHighlightvideoTest() throws Exception{
        PyAnalyzeService pyAnalyzeService = new PyAnalyzeService();

        String video = "..\\back-end\\videos\\highlights\\IG7-DKLzPyQ\\IG7-DKLzPyQ_000000-000100.mp4";

        String result = pyAnalyzeService.runHighlightVideo(video);
        System.out.println("===== 분석 결과 =====");
        System.out.println(result);
    }

    @Test
    public void runVideoTest() throws Exception{
        ObjectMapper mapper = new ObjectMapper();
        JsonNode root = mapper.readTree(new File(VIDEO_RESULT_PATH));
        JsonNode analyses = root.path("analyses");
        JsonNode highlight = analyses.get(analyses.size() - 1)
                .path("analysis_result")
                .path("summary");

        System.out.println(highlight.toString());
    }
}
