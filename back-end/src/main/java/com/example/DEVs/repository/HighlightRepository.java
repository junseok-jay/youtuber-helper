package com.example.DEVs.repository;

import com.example.DEVs.entity.Highlight;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface HighlightRepository extends JpaRepository<Highlight, Long> {
    boolean existsByVideoId(String videoId);
    boolean existsByVideoUrl(String videoUrl);

    @Modifying
    @Transactional
    @Query(
            value = "delete from public.video_highlight where id not in " +
                    "(select id from public.video_highlight where video_id = :videoId "+
                    "order by highlight_score desc limit 5)",
            nativeQuery = true
    )
    void deleteNotHighlightByVideoId(@Param("videoId") String videoId);
    List<Highlight> findAllByVideoIdOrderByStartTime(String videoId);
}