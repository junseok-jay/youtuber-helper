package com.example.DEVs;

import com.example.DEVs.config.WebConfig;
import com.example.DEVs.entity.Highlight;
import com.example.DEVs.repository.HighlightRepository;
import com.example.DEVs.repository.SentimentRepository;
import com.example.DEVs.service.HighlightService;
import com.example.DEVs.service.PyAnalyzeService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

@SpringBootTest
@ActiveProfiles("test")
@ComponentScan(
        excludeFilters = @ComponentScan.Filter(
                type = FilterType.ASSIGNABLE_TYPE,
                classes = WebConfig.class
        )
)
public class scoreTest {

    @Autowired
    private SentimentRepository sentimentRepository;
    @Autowired
    private HighlightRepository highlightRepository;

    private static String videoId = "test_id";

    @BeforeEach
    public void setup() {

        for(int i=0;i<100;i++) {
            Highlight s1 = new Highlight();
            s1.setVideoId(videoId);
            s1.setVideoUrl(Integer.toString(i));
            s1.setStartTime(Integer.toString(i));
            s1.setEndTime(Integer.toString(i+1));

            s1.setPositive(0.01 * i);
            s1.setSummary("test");
            s1.setIncreaseRate(0.01 * i);
            s1.setTotalMessages(105 - i);

            highlightRepository.save(s1);
        }
    }

    @DynamicPropertySource
    static void setProps(DynamicPropertyRegistry registry) {
        registry.add("youtube_data_api_v3_key",
                () -> System.getenv().getOrDefault("YOUTUBE_DATA_API_V3_KEY", "dummy"));
    }


    @Test
    void scoreThresholdTest(){

//        highlightService.extractHighlight(videoId);
        highlightRepository.findAllByVideoIdOrderByStartTime(videoId).size();
    }

    @Test
    void scoreTest(){
        highlightRepository.deleteNotHighlightByVideoId(videoId);
        System.out.println(highlightRepository.findAllByVideoIdOrderByStartTime(videoId).size());
    }
}
