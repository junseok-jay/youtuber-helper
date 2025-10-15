package com.example.DEVs.service;

import com.example.DEVs.entity.Chat;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import org.jsoup.nodes.Document;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class YouTubeLiveChatScraper {

    private final YouTubeHtmlParser htmlParser;

    // 해당 유튜브 라이브의 채팅을 해당 시간 만큼 수집
    public List<Chat> fetchLiveChat(String videoId, Integer time) throws Exception {
        Document doc = htmlParser.fetchVideoDocument(videoId);
        long startEpoch = htmlParser.extractStartTimestamp(doc);
        String continuation = htmlParser.extractContinuationToken(doc);

        List<Chat> allComments = new ArrayList<>();
        Instant end = Instant.now().plusSeconds(time);

        while (Instant.now().isBefore(end)) {
            JsonNode json = htmlParser.fetchChatData(continuation);
            JsonNode actions = json.path("continuationContents").path("liveChatContinuation").path("actions");
            allComments.addAll(htmlParser.extractComments(actions, videoId, startEpoch));

            continuation = json.path("continuationContents")
                    .path("liveChatContinuation")
                    .path("continuations").get(0)
                    .path("timedContinuationData").path("continuation").asText(continuation);

            Thread.sleep(1500);
        }

        System.out.println("채팅 수집 완료");
        return allComments;
    }
}