"""
Gemini API를 사용한 영상 분석 모듈
"""
import json
import logging
import os
import time
from typing import Dict, List, Optional

from dotenv import find_dotenv, load_dotenv
from google import genai
from google.genai import types

try:
    from .s3_connector import S3Connector
except ImportError:
    from s3_connector import S3Connector

# 환경 변수 로드
load_dotenv(find_dotenv())

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class VideoAnalysisResult:
    """영상 분석 결과를 담는 데이터 클래스"""
    
    def __init__(self, summary: str, tags: List[str], category: str):
        self.summary = summary
        self.tags = tags
        self.category = category
    
    def to_dict(self) -> Dict[str, any]:
        """딕셔너리로 변환"""
        return {
            "summary": self.summary,
            "tags": self.tags,
            "category": self.category
        }


class VideoAnalyzer:
    """
    Gemini 모델을 사용하여 영상의 시각/청각 정보를 분석하고
    내용 요약, 태그, 카테고리를 추출하는 클래스
    """
    
    # 지원하는 카테고리 목록
    CATEGORIES = [
        "저스트채팅", "게임", "스포츠", "요리", "미술", "음악", "교육"
    ]
    
    # Gemini 모델 설정
    DEFAULT_MODEL = "gemini-flash-lite-latest"
    DEFAULT_TEMPERATURE = 0.1
    DEFAULT_TOP_P = 0.95
    DEFAULT_TOP_K = 40
    DEFAULT_MAX_OUTPUT_TOKENS = 1000
    FILE_PROCESSING_POLL_INTERVAL = 2  # 파일 처리 상태 확인 간격 (초)
    
    # 프롬프트 템플릿
    ANALYSIS_PROMPT_TEMPLATE = """Analyze this video comprehensively, paying close attention to both the VISUAL ACTION and the AUDIO/DIALOGUE. Extract the following information in JSON format.

Output Requirements:
1. **Language**: All text values must be in **Korean**.
2. **Format**: Return ONLY raw JSON. Do not use Markdown code blocks.
3. **Content Focus**: Do NOT just describe the visual scene (e.g., "A man is sitting"). Focus on the **narrative, conversation topic, and the specific reason why this moment is entertaining** (e.g., funny mistake, interesting story, intense reaction).

Fields:
1. **summary**: A comprehensive 2~3 sentence summary capturing the context.
   - **Context**: What is the streamer doing or talking about? (e.g., specific game situation, telling a story about X)
   - **Event**: What specifically happens or is said that triggers a reaction?
   - **Vibe**: The atmosphere (e.g., humorous, tense, touching) and the result.
   
2. **tags**: A list of 1-4 core keywords in Korean (Topic, Emotion, Game Name, or Action).

3. **category**: The single most relevant category selected from: [{categories}]

Few-Shot Examples:

Example 1 (Gameplay Highlight):
Input: A video of a gamer playing a horror game. The streamer screams in terror at a jumpscare and falls off their chair.
Output:
{{
  "summary": "공포 게임 플레이 중 갑작스러운 점프 스케어에 스트리머가 기겁하며 의자 뒤로 넘어지는 장면입니다. 긴장감 넘치게 진행하던 중 예상치 못한 귀신의 등장에 비명을 지르는 리얼한 반응이 큰 웃음을 줍니다.",
  "tags": ["공포게임", "비명", "몸개그", "리액션"],
  "category": "게임"
}}

Example 2 (Talk/Just Chatting):
Input: A streamer talking to viewers about their embarrassing part-time job experience.
Output:
{{
  "summary": "스트리머가 과거 편의점 알바 시절 겪었던 황당한 진상 손님 썰을 풀고 있습니다. 계산 실수를 무마하려다 오히려 일이 커졌던 에피소드를 재치 있게 묘사하여 시청자들의 공감을 얻고 있습니다.",
  "tags": ["저스트채팅", "알바썰", "에피소드", "유머"],
  "category": "저스트채팅"
}}

Now, analyze the provided video and generate a JSON response following the format above. Focus on the *story* and *interaction*, not just the visuals."""

    def __init__(
        self, 
        api_key: Optional[str] = None,
        model_name: Optional[str] = None,
        s3_connector: Optional[S3Connector] = None
    ):
        """
        VideoAnalyzer 초기화
        
        Args:
            api_key: Gemini API 키 (None일 경우 환경변수 GEMINI_API_KEY 사용)
            model_name: 사용할 Gemini 모델 이름 (None일 경우 기본 모델 사용)
            s3_connector: S3Connector 인스턴스 (None일 경우 새로 생성)
        
        Raises:
            ValueError: API 키가 설정되지 않은 경우
        """
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY가 설정되지 않았습니다. 환경 변수를 확인하세요.")

        self.client = genai.Client(api_key=self.api_key)
        self.model_name = model_name or self.DEFAULT_MODEL
        self.s3_connector = s3_connector or S3Connector()
        
        logger.info(f"VideoAnalyzer 초기화 완료 (모델: {self.model_name})")

    def upload_and_wait(self, file_path: str) -> any:
        """
        파일을 Gemini에 업로드하고 처리 완료까지 대기
        
        Args:
            file_path: 업로드할 파일 경로 (로컬 경로 또는 URL)
        
        Returns:
            처리 완료된 파일 객체
            
        Raises
            RuntimeError: 파일 처리에 실패한 경우
        """
        # 업로드
        logger.info(f"파일 업로드 시작: {file_path}")
        uploaded_file = self.client.files.upload(file=file_path)
        logger.info(f"파일 업로드 완료: {uploaded_file.name}")
        
        # 처리 대기
        logger.info("파일 처리 대기 중...")
        while uploaded_file.state.name == "PROCESSING":
            time.sleep(self.FILE_PROCESSING_POLL_INTERVAL)
            uploaded_file = self.client.files.get(name=uploaded_file.name)
        
        if uploaded_file.state.name != "ACTIVE":
            raise RuntimeError(f"파일 처리 실패: {uploaded_file.state.name}")
        
        logger.info("파일 처리 완료")
        return uploaded_file

    def parse_response(self, response_text: str) -> Dict[str, any]:
        """
        Gemini 응답을 파싱하여 JSON 객체로 변환
        
        Args:
            response_text: Gemini API 응답 텍스트
        
        Returns:
            파싱된 JSON 딕셔너리
            
        Raises:
            ValueError: JSON 파싱에 실패한 경우
        """
        # Markdown 코드 블록 제거
        cleaned_text = response_text.strip()
        if cleaned_text.startswith('```'):
            lines = cleaned_text.split('\n')
            cleaned_text = '\n'.join(lines[1:-1])
        
        try:
            result = json.loads(cleaned_text)
            return result
            
        except json.JSONDecodeError as e:
            logger.error(f"JSON 파싱 실패: {e}\n응답 내용: {cleaned_text}")
            raise ValueError(f"Gemini 응답을 JSON으로 파싱할 수 없습니다: {e}")

    def analyze_video_with_gemini(self, active_file: any) -> Dict[str, any]:
        """
        Gemini API를 사용하여 영상을 분석
        
        Args:
            active_file: Gemini에 업로드되고 처리 완료된 파일 객체
        
        Returns:
            Dict: {
                "summary": str,  # 영상 요약
                "tags": List[str],  # 핵심 키워드 (1-4개)
                "category": str  # 카테고리
            }
            
        Raises:
            Exception: 분석 중 오류가 발생한 경우
        """
        # 프롬프트 생성
        prompt = self.ANALYSIS_PROMPT_TEMPLATE.format(
            categories=', '.join(self.CATEGORIES)
        )
        
        # Gemini API 호출
        logger.info("Gemini 분석 요청 중...")
        response = self.client.models.generate_content(
            model=self.model_name,
            contents=[
                types.Content(
                    role="user",
                    parts=[
                        types.Part.from_uri(
                            file_uri=active_file.uri,
                            mime_type=active_file.mime_type
                        ),
                        types.Part.from_text(text=prompt),
                    ],
                ),
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=self.DEFAULT_TEMPERATURE,
                top_p=self.DEFAULT_TOP_P,
                top_k=self.DEFAULT_TOP_K,
                max_output_tokens=self.DEFAULT_MAX_OUTPUT_TOKENS,
            ),
        )
        
        # 결과 파싱
        logger.info("분석 완료, 결과 파싱 중...")
        return self.parse_response(response.text)

    def analyze_video_from_local(self, video_path: str) -> Dict[str, any]:
        """
        로컬 영상 파일을 분석
        
        Args:
            video_path: 분석할 영상 파일의 로컬 경로
        
        Returns:
            Dict: {
                "summary": str,
                "tags": List[str],
                "category": str
            }
            
        Raises:
            FileNotFoundError: 파일을 찾을 수 없는 경우
            Exception: 분석 중 오류가 발생한 경우
        """
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"파일을 찾을 수 없습니다: {video_path}")
        
        logger.info(f"로컬 영상 분석 시작: {video_path}")
        
        try:
            # 파일 업로드 및 처리 대기
            active_file = self.upload_and_wait(video_path)
            
            # Gemini 분석
            return self.analyze_video_with_gemini(active_file)
            
        except Exception as e:
            logger.error(f"영상 분석 중 오류 발생: {e}")
            raise

    def analyze_video_from_s3(self, bucket_name: str, object_key: str) -> Dict[str, any]:
        """
        S3에 저장된 영상을 Presigned URL을 통해 직접 분석
        (로컬 다운로드 없이 스트리밍 방식으로 처리)
        
        Args:
            bucket_name: S3 버킷 이름
            object_key: S3 객체 키 (파일 경로)
        
        Returns:
            Dict: {
                "summary": str,
                "tags": List[str],
                "category": str
            }
            
        Raises:
            Exception: 분석 중 오류가 발생한 경우
        """
        logger.info(f"S3 영상 분석 시작: s3://{bucket_name}/{object_key}")
        
        try:
            # Presigned URL 생성
            presigned_url = self.s3_connector.generate_presigned_url(bucket_name, object_key)
            
            # 파일 업로드 및 처리 대기
            active_file = self.upload_and_wait(presigned_url)
            
            # Gemini 분석
            return self.analyze_video_with_gemini(active_file)
            
        except Exception as e:
            logger.error(f"S3 영상 분석 중 오류 발생: {e}")
            raise
