package com.example.DEVs.entity;

import jakarta.annotation.Nullable;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "video_highlight")
@Getter
@Setter
public class Highlight {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String videoId;

    private String startTime;  // 00:05:00
    private String endTime;    // 00:06:00

    private double positive;
    private double increaseRate;
    private int totalMessages;
    private double highlightScore;

    @Nullable
    @Column(columnDefinition = "TEXT")
    private String summary;          // 해당 구간 요약 내용
    private String videoUrl;
}