package com.example.DEVs.repository;

import com.example.DEVs.entity.Highlight;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HighlightRepository extends JpaRepository<Highlight, Long> {
    boolean existsByVideoId(String videoId);
    List<Highlight>  findByVideoId(String videoId);
}

