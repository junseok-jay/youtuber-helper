package com.example.DEVs.service;

import com.example.DEVs.entity.Chat;
import com.example.DEVs.repository.ChatRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class YouTubeLiveChatScraper {

    private final ChatRepository chatRepository;
    private final WebClient youtubeWebClient;
    private final ObjectMapper objectMapper;
    private final String apiKey;

    private Instant liveStartTime;


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

    public List<Chat> fetchLiveChatMessages(String chatId, String videoId) {
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

                Chat chat = new Chat();
                chat.setVideoId(videoId);
                chat.setAuthor(item.path("authorDetails").path("displayName").asText());
                chat.setText(item.path("snippet").path("displayMessage").asText());
                chat.setPublishedAt(new YouTubeHtmlParser().formatTime(publishTime - liveStartTime.toEpochMilli()));
                chats.add(chat);
            });
        } catch (Exception e) {
            e.printStackTrace();
        }
        return chats;
    }

    public Instant collectLiveChat(String videoId, int durationSeconds) {
        String chatId = fetchActiveLiveChatId(videoId);
        if (chatId == null || chatId.isEmpty()) return null;

        long end = System.currentTimeMillis() + durationSeconds * 1000L;

        while (System.currentTimeMillis() < end) {
            fetchLiveChatMessages(chatId, videoId).forEach(chatRepository::save);
            try {
                Thread.sleep(5000);
            } catch (InterruptedException ignored) {
            }
        }
        return this.liveStartTime;
    }
}