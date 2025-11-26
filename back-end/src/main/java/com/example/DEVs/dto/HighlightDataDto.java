package com.example.DEVs.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class HighlightDataDto {
    private Long id;
    private String startTime;
    private String endTime;
    private double positiveRate;
    private double viewerIncrease;
    private String summary;
    private String videoUrl;
}

