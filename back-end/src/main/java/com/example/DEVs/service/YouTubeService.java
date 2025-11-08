package com.example.DEVs.service;

import com.example.DEVs.entity.Chat;
import com.example.DEVs.repository.ChatRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class YouTubeService {

    private final ChatRepository chatRepository;
    private final WebClient youtubeWebClient;
    private final ObjectMapper objectMapper;
    private final String apiKey;

    private Instant liveStartTime;

    private final Map<String, Boolean> streamRunning = new ConcurrentHashMap<>();

    // JSON 가져오기 전용 메소드
    protected String fetchJsonFromUrl(String url) {
        return youtubeWebClient.get()
                .uri(url)
                .retrieve()
                .bodyToMono(String.class)
                .block();
    }

    public String fetchActiveLiveChatId(String videoId) {
        try {
            String url = String.format("/videos?part=liveStreamingDetails&id=%s&key=%s", videoId, apiKey);
            String json = fetchJsonFromUrl(url);
            if (json == null) return null;

            JsonNode node = objectMapper.readTree(json)
                    .path("items").get(0)
                    .path("liveStreamingDetails");

            liveStartTime = Instant.parse(node.path("actualStartTime").asText());
            return node.path("activeLiveChatId").asText();

        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public List<Chat> fetchLiveChatMessages(String chatId, String videoId, long collectStartTime) {
        List<Chat> chats = new ArrayList<>();

        try {
            String url = String.format(
                    "/liveChat/messages?liveChatId=%s&part=snippet,authorDetails&key=%s",
                    chatId, apiKey);

            String json = fetchJsonFromUrl(url);
            if (json == null) return chats;

            JsonNode items = objectMapper.readTree(json).path("items");

            items.forEach(item -> {
                long publishTime = Instant.parse(item.path("snippet").path("publishedAt").asText()).toEpochMilli();

                // ✅ collectLiveChat 시작 이후 메시지만 수집
                if (publishTime > collectStartTime) {
                    Chat chat = new Chat();
                    chat.setVideoId(videoId);
                    chat.setAuthor(item.path("authorDetails").path("displayName").asText());
                    chat.setText(item.path("snippet").path("displayMessage").asText());
                    chat.setPublishedAt(new YouTubeHtmlParser().formatTime(publishTime - liveStartTime.toEpochMilli()));
                    chats.add(chat);
                }
            });

        } catch (Exception e) {
            e.printStackTrace();
        }

        return chats;
    }

    /*
    *
    * Sse를 사용한 통신
    *
    * */
    public SseEmitter startLiveStream(String videoId) {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
        streamRunning.put(videoId, true);

        new Thread(() -> {
            try {
                String liveChatId = fetchActiveLiveChatId(videoId);
                if (liveChatId == null) {
                    emitter.send(SseEmitter.event().data("❌ Live chat not found"));
                    emitter.complete();
                    return;
                }

                while (streamRunning.get(videoId)) {

//                    long endTime = System.currentTimeMillis() + (5 * 60 * 1000L);
                    long endTime = System.currentTimeMillis() + (5 * 1000L);
                    List<Chat> collected = new ArrayList<>();

                    // 5분 동안 계속 수집
                    while (System.currentTimeMillis() < endTime && streamRunning.get(videoId)) {
                        List<Chat> freshChats = fetchLiveChatMessages(liveChatId, videoId, System.currentTimeMillis());
                        freshChats.forEach(chatRepository::save);
                        collected.addAll(freshChats);

                        Thread.sleep(5000);
                    }

                    // 5분 수집 끝 → 데이터 SSE로 전송
                    emitter.send(SseEmitter.event().name("chat").data(collected));
                }

                emitter.send(SseEmitter.event().data("✅ Stream stopped"));
                emitter.complete();

            } catch (Exception e) {
                emitter.completeWithError(e);
            }

        }).start();

        return emitter;
    }

    public void stopLiveStream(String videoId) {
        streamRunning.put(videoId, false);
    }
}
