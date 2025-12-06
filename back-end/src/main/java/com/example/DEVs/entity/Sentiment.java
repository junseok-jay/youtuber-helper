package com.example.DEVs.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
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
    private String endTime;
    private Integer totalMessages;

    private Double positive;
    private Double negative;
    private Double neutral;

}
