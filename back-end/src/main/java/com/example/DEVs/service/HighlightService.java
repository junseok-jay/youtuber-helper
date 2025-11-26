package com.example.DEVs.service;

import com.example.DEVs.entity.Highlight;
import com.example.DEVs.entity.Sentiment;
import com.example.DEVs.repository.HighlightRepository;
import com.example.DEVs.repository.SentimentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;

@Service
@RequiredArgsConstructor
public class HighlightService {

    // 원본 영상 저장 경로
    private static final String VIDEO_BASE_PATH = "./videos/";

    private final HighlightRepository highlightRepository;
    private final SentimentRepository sentimentRepository;

    public void saveVideo(MultipartFile videoFile, String videoId) throws IOException, InterruptedException{
        Files.createDirectories(Paths.get(VIDEO_BASE_PATH));

        Path filePath = Path.of(VIDEO_BASE_PATH, videoId + ".mp4");

        Files.copy(videoFile.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        if(!highlightRepository.existsByVideoId(videoId)) {
            extractHighlight(videoId);
        }
    }

    public void extractHighlight(String videoId){
        List<Sentiment> sentimentStream = sentimentRepository.findAllByVideoId(videoId);
        Sentiment curr = sentimentStream.remove(0);

        for (Sentiment s : sentimentStream) {
            Sentiment prev = curr;
            curr = s;

            double prevMsg = prev.getTotalMessages();
            double currMsg = curr.getTotalMessages();

            if (prevMsg == 0) continue;

            double increaseRate = (currMsg - prevMsg) / prevMsg;

            boolean positiveHigh = curr.getPositive() >= 50.0;
            boolean increased30 = increaseRate >= 0.30;

            if (positiveHigh || increased30) {

                Highlight h = new Highlight();
                h.setVideoId(videoId);

                h.setStartTime(prev.getTimeline());   // 00:05:00
                h.setEndTime(curr.getTimeline());     // 00:06:00

                h.setPositive(curr.getPositive());
                h.setTotalMessages(curr.getTotalMessages());
                h.setIncreaseRate(Math.round(increaseRate * 100) / 100.0);

                h.setReason("POSITIVE>=50 or MSG INCREASE>=30%");

                highlightRepository.save(h);
            }
        }
    }

}
