"""
스트리밍 채팅 데이터 감정 분석 모듈
Gemini Flash Lite API를 사용하여 긍정/부정/중립 감정 분석
"""

import os
import json
from typing import List, Dict
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

class SentimentAnalyzer:
    """감정 분석 클래스"""

    def __init__(self, api_key: str = None, temperature: float = 0.1):
        """
        Args:
            api_key: Gemini API 키 (None일 경우 환경변수에서 가져옴)
            temperature: 모델 temperature 설정 (기본값: 0.1)
        """
        self.api_key = api_key or os.getenv('GEMINI_API_KEY')
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY가 설정되지 않았습니다.")

        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel(
            'gemini-flash-lite-latest',
            generation_config=genai.GenerationConfig(
                temperature=temperature,
                response_mime_type="application/json"
            )
        )

    def analyze_messages(self, messages: List[str]) -> Dict[str, float]:
        """
        채팅 메시지들을 일괄 분석하여 감정 비율을 반환

        Args:
            messages: 분석할 채팅 메시지 리스트

        Returns:
            감정 비율 딕셔너리 (예: {"positive": 25.5, "negative": 55.5, "neutral": 20.0})
        """
        if not messages:
            return {"positive": 0.0, "negative": 0.0, "neutral": 0.0}

        # 메시지들을 번호와 함께 텍스트로 변환
        messages_text = "\n".join([f"{i+1}. {msg}" for i, msg in enumerate(messages)])

        prompt = f"""Please classify the following streaming chat messages as positive, negative, or neutral, and calculate the percentage of each sentiment among all messages.

Chat messages:
{messages_text}

Response format:
{{
"positive": float,
"negative": float,
"neutral": float
}}

Rules:
- The sum of the three values ​​must be 100.
- Only display up to the second decimal place.
- Respond only in JSON format.
"""

        try:
            response = self.model.generate_content(prompt)

            # Markdown 코드 블록 제거 (```json ... ``` 형태)
            response_text = response.text.strip()
            if response_text.startswith('```'):
                # 첫 번째 줄(```json)과 마지막 줄(```) 제거
                lines = response_text.split('\n')
                response_text = '\n'.join(lines[1:-1])

            result = json.loads(response_text)

            # 결과 검증 및 정규화
            total = result.get('positive', 0) + result.get('negative', 0) + result.get('neutral', 0)

            if total == 0:
                return {"positive": 0.0, "negative": 0.0, "neutral": 0.0}

            # 합이 정확히 100이 되도록 조정
            if abs(total - 100) > 0.1:
                result['positive'] = round((result.get('positive', 0) / total) * 100, 1)
                result['negative'] = round((result.get('negative', 0) / total) * 100, 1)
                result['neutral'] = round((result.get('neutral', 0) / total) * 100, 1)

                # 반올림 오차 조정
                current_total = result['positive'] + result['negative'] + result['neutral']
                if current_total != 100:
                    diff = 100 - current_total
                    result['neutral'] = round(result['neutral'] + diff, 1)

            return {
                "positive": float(result.get('positive', 0)),
                "negative": float(result.get('negative', 0)),
                "neutral": float(result.get('neutral', 0))
            }

        except json.JSONDecodeError as e:
            raise ValueError(f"Gemini API 응답을 JSON으로 파싱할 수 없습니다: {e}")
        except Exception as e:
            raise RuntimeError(f"감정 분석 중 오류 발생: {e}")
