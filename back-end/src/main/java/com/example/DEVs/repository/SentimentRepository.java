package com.example.DEVs.repository;

import com.example.DEVs.entity.Sentiment;
import com.example.DEVs.entity.SentimentId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SentimentRepository extends JpaRepository<Sentiment, SentimentId> {
    List<Sentiment> findByVideoId(String videoId);
    Optional<Sentiment> findFirstByVideoIdOrderByTimelineDesc(String videoId);
}
