package com.example.DEVs.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

@Service
@RequiredArgsConstructor
public class HighlightService {

    // 원본 영상 저장 경로
    private static final String VIDEO_BASE_PATH = "./videos/";

    public void saveVideo(MultipartFile videoFile, String videoId) throws IOException, InterruptedException{
        Files.createDirectories(Paths.get(VIDEO_BASE_PATH));

        Path filePath = Path.of(VIDEO_BASE_PATH, videoId + ".mp4");

        Files.copy(videoFile.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
    }

}
