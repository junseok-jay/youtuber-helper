package com.example.DEVs.controller;


import com.example.DEVs.entity.Chat;
import com.example.DEVs.repository.ChatRepository;
import com.example.DEVs.service.YouTubeLiveChatScraper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequiredArgsConstructor
@RestController
@RequestMapping("/youtube")
public class ChatController {

    private final YouTubeLiveChatScraper scraper;
    private final ChatRepository chatRepository;

    @GetMapping("/chat")
    public ResponseEntity<List<Chat>> getLiveChat(@RequestParam String videoId) throws Exception {
        List<Chat> comments = scraper.fetchLiveChat(videoId, 5);
        chatRepository.saveAll(comments);
        return ResponseEntity.ok(comments);
    }

}
