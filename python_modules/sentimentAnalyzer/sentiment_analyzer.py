"""
스트리밍 채팅 데이터 감정 분석 모듈
Gemini Flash Lite API를 사용하여 긍정/부정/중립 감정 분석
"""

import os
import json
from typing import List, Dict
import google.generativeai as genai
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

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
        print(f"DEBUG: Gemini API 프롬프트에 포함될 메시지 수: {len(messages)}")
        messages_text = "\n".join([f"{i+1}. {msg}" for i, msg in enumerate(messages)])

        prompt = f"""Please classify the following streaming chat messages as positive, negative, or neutral, and count the number of messages for each sentiment.

Chat messages:
{messages_text}

Response format:
{{
"positive": int,
"negative": int,
"neutral": int
}}

Example of what the response would look like once you provide the messages:
    If the messages were:
    1. "This is great!"
    2. "I don't like this part."
    3. "The stream is live."
    4. "Awesome content."

The analysis (4 total messages):
    Positive (2): "This is great!", "Awesome content."
    Negative (1): "I don't like this part."
    Neutral (1): "The stream is live."

The response:
{{
"positive": 2,
"negative": 1,
"neutral": 1
}}
    
Reference:
- If it contains words like "ㅋㅋㅋ", there is a high chance that it is a positive chat.

Rules:
- Respond only in JSON format.
- Do not output the thinking stage, only output in json format.
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
            # 모델이 반환한 카운트 가져오기
            pos_count = result.get('positive', 0)
            neg_count = result.get('negative', 0)
            neu_count = result.get('neutral', 0)
            
            total_count = pos_count + neg_count + neu_count

            if total_count == 0:
                return {"positive": 0.0, "negative": 0.0, "neutral": 0.0}

            # 퍼센트 계산
            pos_pct = (pos_count / total_count) * 100
            neg_pct = (neg_count / total_count) * 100
            neu_pct = (neu_count / total_count) * 100
            
            # 소수점 첫째 자리까지 반올림
            final_result = {
                "positive": round(pos_pct, 1),
                "negative": round(neg_pct, 1),
                "neutral": round(neu_pct, 1)
            }

            # 합이 정확히 100이 되도록 조정 (반올림 오차 보정)
            current_total = final_result['positive'] + final_result['negative'] + final_result['neutral']
            if abs(current_total - 100) > 0.01: # 100이 아닌 경우
                 diff = 100 - current_total
                 # 가장 큰 비중을 가진 항목에 오차 더하기 (또는 neutral에 더하기)
                 # 여기서는 간단하게 neutral에 더함
                 final_result['neutral'] = round(final_result['neutral'] + diff, 1)

            return final_result

        except json.JSONDecodeError as e:
            raise ValueError(f"Gemini API 응답을 JSON으로 파싱할 수 없습니다: {e}")
        except Exception as e:
            raise RuntimeError(f"감정 분석 중 오류 발생: {e}")
