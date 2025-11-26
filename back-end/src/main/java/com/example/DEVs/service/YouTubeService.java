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
public class YouTubeService {

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

    private String fetchActiveLiveChatId(String videoId) {
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

    private List<Chat> fetchLiveChatMessages(String chatId, String videoId) {
        List<Chat> chats = new ArrayList<>();

        try {
            String url = String.format(
                    "/liveChat/messages?liveChatId=%s&part=snippet,authorDetails&key=%s",
                    chatId, apiKey);

            String json = fetchJsonFromUrl(url);
            if (json == null) return chats;

            JsonNode items = objectMapper.readTree(json).path("items");

            items.forEach(item -> {
                long publishTime = Instant.parse(item.path("snippet").path("publishedAt").asText()).toEpochMilli()
                        - liveStartTime.toEpochMilli();
                String author = item.path("authorDetails").path("displayName").asText();
                String message = item.path("snippet").path("displayMessage").asText();

                if(checkDuplicate(videoId, author, message, publishTime)){
                    return;
                }
                String publishedAt = formatTime(publishTime);

                Chat chat = new Chat();
                chat.setVideoId(videoId);
                chat.setAuthor(author);
                chat.setText(message);
                chat.setPublishedAt(publishedAt);

                chatRepository.save(chat);
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

        long end = System.currentTimeMillis() + durationSeconds * 1_000L;
        try {
            Thread.sleep(durationSeconds * 1_000L);
            fetchLiveChatMessages(chatId, videoId);
        }
        catch (Exception e){
            throw new RuntimeException(e);
        }
        return this.liveStartTime;
    }

    public String formatTime(long ms) {
        long hh = ms / 3600_000;
        long mm = (ms % 3600_000) / 60_000;
        long ss = (ms % 60_000) / 1000;
        return String.format("%02d:%02d:%02d", hh, mm, ss);
    }

    boolean checkDuplicate(String videoId, String author, String message, long publishAt){
        String start = formatTime(publishAt - 60_000L);
        String end = formatTime(publishAt + 60_000L);

        return chatRepository.existsByVideoIdAndAuthorAndTextAndPublishedAtBetween(
                videoId, author, message, start, end
        );
    }
}