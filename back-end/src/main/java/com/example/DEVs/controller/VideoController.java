package com.example.DEVs.controller;

import com.example.DEVs.dto.HighlightDataDto;
import com.example.DEVs.service.HighlightService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/API/video")
@RequiredArgsConstructor
public class VideoController {

    private final HighlightService highlightServiceService;

    @PostMapping("/analyze")
    public ResponseEntity<?> uploadVideo(@RequestParam("video") MultipartFile videoFile,
                                         @RequestParam String channelId) throws IOException, InterruptedException {

        List<HighlightDataDto> timeline = highlightServiceService.highlightVideo(videoFile, channelId);

        return ResponseEntity.ok(Map.of(
                "highlights", timeline
        ));
    }
}
