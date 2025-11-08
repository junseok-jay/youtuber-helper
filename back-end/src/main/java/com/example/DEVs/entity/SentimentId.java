package com.example.DEVs.entity;

import java.io.Serializable;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode
public class SentimentId implements Serializable {
    private String videoId;
    private String timeline;
}