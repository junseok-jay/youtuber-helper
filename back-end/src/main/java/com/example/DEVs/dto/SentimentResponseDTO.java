package com.example.DEVs.dto;

import com.example.DEVs.entity.Sentiment;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SentimentResponseDTO {
    private String videoId;
    private String timeline;
    private Integer totalMessages;
    private Double positive;
    private Double negative;
    private Double neutral;

    public SentimentResponseDTO(Sentiment sentiment) {
        this.videoId = sentiment.getVideoId();
        this.timeline = sentiment.getTimeline();
        this.totalMessages = sentiment.getTotalMessages();
        this.positive = sentiment.getPositive();
        this.negative = sentiment.getNegative();
        this.neutral = sentiment.getNeutral();
    }
}

