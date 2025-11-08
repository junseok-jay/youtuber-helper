"""
스트리밍 채팅 데이터 감정 분석 메인 실행 파일
PostgreSQL DB에서 데이터를 가져와 Gemini API로 감정 분석 수행
"""

import json
import argparse
import os
from datetime import datetime
from db_manager import DatabaseManager
from sentiment_analyzer import SentimentAnalyzer


def main():
    """메인 실행 함수"""
    parser = argparse.ArgumentParser(
        description='스트리밍 채팅 데이터 감정 분석'
    )
    parser.add_argument(
        '--table',
        type=str,
        default='youtube_comments',
        help='채팅 데이터가 저장된 테이블 이름 (기본값: youtube_comments)'
    )
    parser.add_argument(
        '--column',
        type=str,
        default='text',
        help='메시지 컬럼명 (기본값: text)'
    )
    parser.add_argument(
        '--limit',
        type=int,
        default=None,
        help='분석할 메시지 수 제한 (기본값: 전체)'
    )
    parser.add_argument(
        '--where',
        type=str,
        default=None,
        help='WHERE 조건절 (예: "published_at > \'2025-01-01T10:20:30Z\'")'
    )
    parser.add_argument(
        '--output',
        type=str,
        default='sentiment_result.json',
        help='결과를 저장할 JSON 파일 경로 (기본값: sentiment_result.json)'
    )

    args = parser.parse_args()

    try:
        print("=" * 60)
        print("스트리밍 채팅 데이터 감정 분석 시작")
        print("=" * 60)

        # 데이터베이스에서 메시지 가져오기
        print("\n[1/3] 데이터베이스에서 메시지 가져오는 중...")
        with DatabaseManager() as db:
            messages = db.fetch_messages(
                table_name=args.table,
                message_column=args.column,
                limit=args.limit,
                where_clause=args.where
            )

        if not messages:
            print("경고: 가져온 메시지가 없습니다.")
            return

        print(f"총 {len(messages)}개의 메시지를 가져왔습니다.")

        # 감정 분석 수행
        print("\n[2/3] 감정 분석 수행 중...")
        analyzer = SentimentAnalyzer(temperature=0.1)
        result = analyzer.analyze_messages(messages)

        # 결과 저장
        print("\n[3/3] 결과 저장 중...")

        if os.path.exists(args.output):
            with open(args.output, 'r', encoding='utf-8') as f:
                try:
                    data = json.load(f)
                    if 'analyses' not in data:
                        data = {'analyses': []}
                except json.JSONDecodeError:
                    data = {'analyses': []}
        else:
            data = {'analyses': []}

        # 새 분석 결과 추가
        new_analysis = {
            'timestamp': datetime.now().isoformat(),
            'total_messages': len(messages),
            'sentiment_summary': result,
            'query_info': {
                'table': args.table,
                'column': args.column,
                'where_clause': args.where,
                'limit': args.limit
            }
        }
        data['analyses'].append(new_analysis)

        # 파일에 저장
        with open(args.output, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        # 결과 출력
        print("\n" + "=" * 60)
        print("감정 분석 결과:")
        print("=" * 60)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        print("\n결과가 '{}'에 추가되었습니다.".format(args.output))
        print("총 {}개의 분석 결과가 저장되어 있습니다.".format(len(data['analyses'])))
        print("=" * 60)

    except Exception as e:
        print(f"\n오류 발생: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
