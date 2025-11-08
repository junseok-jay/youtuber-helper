package com.example.DEVs.service;

import com.example.DEVs.entity.Chat;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;


@Component
public class YouTubeHtmlParser {
    private static final ObjectMapper MAPPER = new ObjectMapper();
    private final WebClient webClient = WebClient.builder()
            .baseUrl("https://www.youtube.com")
            .defaultHeader("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
            .exchangeStrategies(
                    ExchangeStrategies.builder()
                            .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(10 * 1024 * 1024))
                            .build()
            )
            .build();

    public long extractStartTimestamp(Document doc) {
        Pattern pattern = Pattern.compile("\"startTimestamp\":\"(.*?)\"");
        Matcher matcher = pattern.matcher(doc.html());
        if (matcher.find()) {
            return Instant.parse(matcher.group(1)).toEpochMilli();
        }
        throw new IllegalStateException("라이브 방송이 아닙니다.");
    }

    public String extractContinuationToken(Document doc) {
        Pattern pattern = Pattern.compile("\"continuation\":\"(.*?)\"");
        Matcher matcher = pattern.matcher(doc.html());
        if (matcher.find()) {
            return matcher.group(1);
        }
        throw new IllegalStateException("Continuation token을 찾을 수 없습니다.");
    }

    public Document fetchVideoDocument(String videoId) throws Exception {
        return Jsoup.connect("https://www.youtube.com/watch?v=" + videoId)
                .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
                .get();
    }

    public JsonNode fetchChatData(String continuation) throws Exception {
        String payload = String.format("""
            {
              "context": {
                "client": {
                  "clientName": "WEB",
                  "clientVersion": "2.20241001.01.00"
                }
              },
              "continuation": "%s"
            }
        """, continuation);

        String response = webClient.post()
                .uri("/youtubei/v1/live_chat/get_live_chat")
                .header("Content-Type", "application/json")
                .bodyValue(payload)
                .retrieve()
                .bodyToMono(String.class)
                .block();

        return MAPPER.readTree(response);
    }

    public List<Chat> extractComments(JsonNode actions, String videoId, long startEpoch) {
        List<Chat> comments = new ArrayList<>();

        if (actions.isArray()) {
            for (JsonNode action : actions) {
                JsonNode messageRenderer = action.path("addChatItemAction")
                        .path("item").path("liveChatTextMessageRenderer");

                if (messageRenderer.isMissingNode()) continue;

                String author = messageRenderer.path("authorName").path("simpleText").asText("Unknown");
                String text = messageRenderer.path("message").path("runs").get(0).path("text").asText("");
                if (text.isBlank()) continue;

                long timestampUsec = messageRenderer.path("timestampUsec").asLong(0);
                long chatEpoch = timestampUsec / 1000;
                long relative = chatEpoch - startEpoch;

                Chat comment = new Chat();
                comment.setVideoId(videoId);
                comment.setAuthor(author);
                comment.setText(text);
                comment.setPublishedAt(formatTime(relative));

                comments.add(comment);
            }
        }
        return comments;
    }

    public String formatTime(long ms) {
        long hh = ms / 3600_000;
        long mm = (ms % 3600_000) / 60_000;
        long ss = (ms % 60_000) / 1000;
        return String.format("%02d:%02d:%02d", hh, mm, ss);
    }
}
