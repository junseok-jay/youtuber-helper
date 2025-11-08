package com.example.DEVs.controller;

import com.example.DEVs.entity.Sentiment;
import com.example.DEVs.repository.SentimentRepository;
import com.example.DEVs.service.PyAnalService;
import com.example.DEVs.service.YouTubeLiveChatScraper;
import com.example.DEVs.service.YouTubeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.Instant;

@RequiredArgsConstructor
@RestController
@RequestMapping("/youtube")
public class ChatController {

    private final YouTubeLiveChatScraper scraper;
    private final SentimentRepository sentimentRepository;
    private final PyAnalService pyAnalService;

    private final YouTubeService youTubeService;

    /**
     * 특정 비디오 ID의 라이브 채팅을 수집하고 DB에 저장
     * youtube api 사용
     *
     * @param videoId         유튜브 비디오 ID
     * @param durationSeconds 수집 지속 시간 (초)
     * @return 성공 메시지
     */
    @PostMapping("/live/sentiment/start")
    public ResponseEntity<?> collectLiveChat(
            @RequestParam String videoId,
            @RequestParam(defaultValue = "60") int durationSeconds) {

        try {
            long collectStartTime = Instant.now().toEpochMilli();
            Instant liveStartTime = scraper.collectLiveChat(videoId, durationSeconds);
            collectStartTime -= liveStartTime.toEpochMilli();

            Sentiment sentiment = pyAnalService.runSentimentAnalyzer(videoId, collectStartTime);
            sentimentRepository.save(sentiment);

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Python 분석 오류: " + e.getMessage());
        }

        // 저장된 sentiment list 가져오기
        return sentimentRepository.findFirstByVideoIdOrderByTimelineDesc(videoId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());

    }



    @GetMapping(value = "/streamCollect", produces = "text/event-stream")
    public SseEmitter stream(@RequestParam String videoId) {
        return youTubeService.startLiveStream(videoId);
    }

    @PostMapping("/stopStream")
    public String stopStream(@RequestParam String videoId) {
        youTubeService.stopLiveStream(videoId);
        return "stopped";
    }
}
