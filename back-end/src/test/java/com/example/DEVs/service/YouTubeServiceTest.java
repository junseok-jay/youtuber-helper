package com.example.DEVs.service;

import com.example.DEVs.entity.Chat;
import com.example.DEVs.repository.ChatRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class YouTubeServiceTest {

    @Autowired
    ChatRepository chatRepository;

    @Autowired
    YouTubeService youTubeService;

    String videoId = "uFKa8H8TOBM";
    String author = "@DaW-on";
    String message = "❤\uFE0F❤\uFE0F❤\uFE0F김현지가 누구야❤\uFE0F❤\uFE0F김현지가 누구야❤\uFE0F❤\uFE0F김현지가 누구야❤\uFE0F❤\uFE0F김현지가 누구야❤\uFE0F❤\uFE0F김현지가 누구야❤\uFE0F❤\uFE0F김현지가 누구야❤\uFE0F❤\uFE0F김현지가 누구야❤\uFE0F❤\uFE0F김현지가 누구야❤\uFE0F❤\uFE0F김현지가 누구야❤\uFE0F❤\uFE0F김현지가 누구야❤\uFE0F❤\uFE0F김현지가 누구야❤\uFE0F❤\uFE0F김현지가 누구야❤\uFE0F❤\uFE0F김현지가 누구야❤\uFE0F❤\uFE0F김현지가 누구야❤\uFE0F❤\uFE0F김현지가 누구야❤\uFE0F❤\uFE0F김현지가 누구야❤\uFE0F❤\uFE0F❤\uFE0F";

    @BeforeEach
    void setup() {
        chatRepository.deleteAll(); // DB 초기화
    }

    @Test
    void testDuplicateWithin60Seconds() {
        // 기존 댓글 저장 (예: 100,000ms 지점)
        Chat chat = new Chat();
        chat.setVideoId(videoId);
        chat.setAuthor(author);
        chat.setText(message);
        chat.setPublishedAt("00:43:30");
        chatRepository.save(chat);

        // 50초 후 댓글 → 중복 처리됨
        long newPublishTime = 43*60000 + 32*1000;

        boolean result = youTubeService.checkDuplicate(
                videoId, author, message, newPublishTime
        );

        assertThat(result).isTrue();
    }

    @Test
    void testNotDuplicateAfter60Seconds() {
        // 기존 댓글 저장
        Chat chat = new Chat();
        chat.setVideoId(videoId);
        chat.setAuthor(author);
        chat.setText(message);
        chat.setPublishedAt(youTubeService.formatTime(100_000L));
        chatRepository.save(chat);

        // 70초 후 → 중복 아님
        long newPublishTime = 100_000L + 70_000L;

        boolean result = youTubeService.checkDuplicate(
                videoId, author, message, newPublishTime
        );

        assertThat(result).isFalse();
    }

    @Test
    void testDifferentAuthor_NotDuplicate() {
        Chat chat = new Chat();
        chat.setVideoId(videoId);
        chat.setAuthor("otherUser");
        chat.setText(message);
        chat.setPublishedAt(youTubeService.formatTime(100_000L));
        chatRepository.save(chat);

        boolean result = youTubeService.checkDuplicate(
                videoId, author, message, 100_050L
        );

        assertThat(result).isFalse();
    }

    @Test
    void testDifferentMessage_NotDuplicate() {
        Chat chat = new Chat();
        chat.setVideoId(videoId);
        chat.setAuthor(author);
        chat.setText("different");
        chat.setPublishedAt(youTubeService.formatTime(100_000L));
        chatRepository.save(chat);

        boolean result = youTubeService.checkDuplicate(
                videoId, author, message, 100_050L
        );

        assertThat(result).isFalse();
    }
}
