package com.example.DEVs.service;

import com.example.DEVs.entity.Chat;
import com.example.DEVs.repository.ChatRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

public class YouTubeServiceTest {

    private ChatRepository chatRepository;
    private WebClient youtubeWebClient;
    private ObjectMapper objectMapper;
    private String apiKey = "dummy-api-key";
    private YouTubeService youTubeService;

    @BeforeEach
    void setUp() {
        chatRepository = mock(ChatRepository.class);
        youtubeWebClient = mock(WebClient.class);
        objectMapper = new ObjectMapper();

        youTubeService = new YouTubeService(chatRepository, youtubeWebClient, objectMapper, apiKey);
    }

    @Test
    void testFetchActiveLiveChatId() throws Exception {
        // spy 처리
        YouTubeService spyService = spy(youTubeService);
        String videoJson = """
            {
              "items": [
                {
                  "liveStreamingDetails": {
                    "activeLiveChatId": "LIVE_CHAT_123"
                  }
                }
              ]
            }
            """;

        doReturn(videoJson).when(spyService).fetchJsonFromUrl(anyString());

        String liveChatId = spyService.fetchActiveLiveChatId("dummyVideoId");
        assertEquals("LIVE_CHAT_123", liveChatId);
    }

    @Test
    void testFetchLiveChatMessages() throws Exception {
        YouTubeService spyService = spy(youTubeService);
        String liveChatJson = """
            {
              "items": [
                {
                  "snippet": {
                    "displayMessage": "Hello!",
                    "publishedAt": "2025-10-31T12:00:00Z"
                  },
                  "authorDetails": {
                    "displayName": "User1"
                  }
                },
                {
                  "snippet": {
                    "displayMessage": "Hi there!",
                    "publishedAt": "2025-10-31T12:01:00Z"
                  },
                  "authorDetails": {
                    "displayName": "User2"
                  }
                }
              ]
            }
            """;

        doReturn(liveChatJson).when(spyService).fetchJsonFromUrl(anyString());

        List<Chat> chats = spyService.fetchLiveChatMessages("LIVE_CHAT_123", "video1");

        assertEquals(2, chats.size());
        assertEquals("User1", chats.get(0).getAuthor());
        assertEquals("Hello!", chats.get(0).getText());
        assertEquals("User2", chats.get(1).getAuthor());
        assertEquals("Hi there!", chats.get(1).getText());
    }

    @Test
    void testCollectLiveChat() {
        YouTubeService spyService = spy(youTubeService);

        // fetchActiveLiveChatId, fetchLiveChatMessages Mock
        doReturn("LIVE_CHAT_123").when(spyService).fetchActiveLiveChatId("video1");

        Chat chatMock = new Chat();
        chatMock.setAuthor("User1");
        chatMock.setText("Hello!");
        chatMock.setVideoId("video1");
        chatMock.setPublishedAt("2025-10-31T12:00:00Z");

        doReturn(List.of(chatMock)).when(spyService).fetchLiveChatMessages("LIVE_CHAT_123", "video1");

        // 실제 1초만 수집
        spyService.collectLiveChat("video1", 1);

        verify(chatRepository, atLeastOnce()).save(chatMock);
    }
}
