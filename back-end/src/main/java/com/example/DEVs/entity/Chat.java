package com.example.DEVs.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "youtube_comments")
public class Chat {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String videoId;
    private String author;
    @Column(columnDefinition = "TEXT")
    private String text;
    private String publishedAt;
}
