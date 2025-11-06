package com.example.DEVs.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
@Entity
@IdClass(SentimentId.class)
@Table(name = "Sentiment")
public class Sentiment {
    @Id
    private String videoId;
    @Id
    private String timeline;
    private Integer totalMessages;

    private Double positive;
    private Double negative;
    private Double neutral;

}
