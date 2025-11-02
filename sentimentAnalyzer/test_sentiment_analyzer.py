"""
DB 연결 없이 감정 분석을 테스트하는 스크립트
샘플 채팅 데이터를 사용하여 감정 분석 기능을 테스트합니다.
"""

import json
from sentiment_analyzer import SentimentAnalyzer


def test_with_sample_data():
    """샘플 데이터를 사용한 감정 분석 테스트"""

    # 샘플 채팅 메시지 
    sample_messages = [
        "와 이거 진짜 재밌다!",
        "ㅋㅋㅋㅋㅋ 대박",
        "이건 좀 별로네...",
        "스트리머 실력 좋네요",
        "지루하다",
        "오늘 방송 최고!",
        "이게 뭐야 ㅡㅡ",
        "그냥 그래",
        "최고최고 ㅎㅎ",
        "별로인데?",
        "음... 괜찮은 것 같아",
        "진짜 웃기네 ㅋㅋ",
        "이해가 안 됨",
        "좋아요!",
        "그냥 보는 중",
        "너무 짜증나",
        "완전 꿀잼",
        "평범하네",
        "최악이다",
        "예전만 못하네",
        "구독했어요!",
        "별 감흥 없음",
        "진짜 대단하다",
        "뭐 이런 걸 다 하냐",
        "잘 보고 있어요",
    ]

    print("=" * 60)
    print("감정 분석 테스트 (DB 연결 없음)")
    print("=" * 60)

    print(f"\n샘플 메시지 수: {len(sample_messages)}개")
    print("\n샘플 메시지 일부:")
    for i, msg in enumerate(sample_messages[:5], 1):
        print(f"  {i}. {msg}")
    print("  ...")

    try:
        print("\n[1/2] Gemini API로 감정 분석 수행 중...")
        analyzer = SentimentAnalyzer(temperature=0.1)
        result = analyzer.analyze_messages(sample_messages)

        print("\n[2/2] 결과 저장 중...")
        output_file = "test_sentiment_result.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)

        print("\n" + "=" * 60)
        print("감정 분석 결과:")
        print("=" * 60)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        print(f"\n결과가 '{output_file}'에 저장되었습니다.")
        print("=" * 60)

        # 결과 시각화
        print("\n감정 분포:")
        print(f"  긍정(Positive): {result['positive']}%")
        print(f"  부정(Negative): {result['negative']}%")
        print(f"  중립(Neutral):  {result['neutral']}%")
        print(f"  합계:           {result['positive'] + result['negative'] + result['neutral']}%")

    except Exception as e:
        print(f"\n오류 발생: {e}")
        import traceback
        traceback.print_exc()


def test_with_custom_messages():
    """사용자 정의 메시지로 테스트"""

    print("\n\n" + "=" * 60)
    print("사용자 정의 메시지 테스트")
    print("=" * 60)

    custom_messages = [
        "정말 최고의 방송이에요!",
        "별로에요...",
        "그냥 그래요",
    ]

    print(f"\n테스트 메시지:")
    for i, msg in enumerate(custom_messages, 1):
        print(f"  {i}. {msg}")

    try:
        analyzer = SentimentAnalyzer(temperature=0.1)
        result = analyzer.analyze_messages(custom_messages)

        print("\n감정 분석 결과:")
        print(json.dumps(result, ensure_ascii=False, indent=2))

    except Exception as e:
        print(f"\n오류 발생: {e}")


if __name__ == "__main__":
    # 샘플 데이터 테스트
    test_with_sample_data()
    # test_with_custom_messages()

    print("\n테스트 완료!")
