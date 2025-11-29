"""
Video Analyzer 실행 스크립트

사용법:
    # 로컬 비디오 파일 분석
    python run_videoAnalyzer.py --file /path/to/video.mp4
    
    # S3 비디오 분석
    python run_videoAnalyzer.py --s3 --bucket my-bucket --key path/to/video.mp4
    
    # 커스텀 모델 사용
    python run_videoAnalyzer.py --file /path/to/video.mp4 --model gemini-1.5-pro
"""
import argparse
import json
import logging
import os
import sys
from datetime import datetime
from typing import Dict

from video_analyzer import VideoAnalyzer
from s3_connector import S3Connector

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 기본 결과 파일 경로 (백엔드 통합용)
DEFAULT_OUTPUT_PATH = "./video_analysis_result.json"


def analyze_local_video(video_path: str, model_name: str = None) -> Dict:
    """
    로컬 비디오 파일을 분석
    
    Args:
        video_path: 분석할 비디오 파일 경로
        model_name: 사용할 Gemini 모델 이름
    
    Returns:
        분석 결과 딕셔너리
    """
    logger.info(f"로컬 비디오 분석 시작: {video_path}")
    
    try:
        analyzer = VideoAnalyzer(model_name=model_name)
        result = analyzer.analyze_video(video_path)
        
        logger.info("분석 완료!")
        return result
        
    except Exception as e:
        logger.error(f"분석 중 오류 발생: {e}")
        raise


def analyze_s3_video(bucket_name: str, object_key: str, model_name: str = None) -> Dict:
    """
    S3에 저장된 비디오를 분석
    
    Args:
        bucket_name: S3 버킷 이름
        object_key: S3 객체 키 (파일 경로)
        model_name: 사용할 Gemini 모델 이름
    
    Returns:
        분석 결과 딕셔너리
    """
    logger.info(f"S3 비디오 분석 시작: s3://{bucket_name}/{object_key}")
    
    try:
        s3_connector = S3Connector()
        analyzer = VideoAnalyzer(model_name=model_name, s3_connector=s3_connector)
        result = analyzer.analyze_video_from_s3(bucket_name, object_key)
        
        logger.info("분석 완료!")
        return result
        
    except Exception as e:
        logger.error(f"분석 중 오류 발생: {e}")
        raise


def save_result(result: Dict, output_path: str, video_source: Dict) -> None:
    """
    분석 결과를 JSON 파일로 저장 (누적 방식)
    
    Args:
        result: 분석 결과 딕셔너리
        output_path: 저장할 파일 경로
        video_source: 비디오 소스 정보 (file_path, bucket, key 등)
    """
    # 기존 파일이 있으면 읽어오기
    if os.path.exists(output_path):
        with open(output_path, 'r', encoding='utf-8') as f:
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
        'video_source': video_source,
        'analysis_result': result
    }
    data['analyses'].append(new_analysis)
    
    # 파일에 저장
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    logger.info(f"결과를 저장했습니다: {output_path}")
    logger.info(f"총 {len(data['analyses'])}개의 분석 결과가 저장되어 있습니다.")


def print_result(result: Dict):
    """
    분석 결과를 포맷팅하여 출력합니다.
    
    Args:
        result: 분석 결과 딕셔너리
    """
    print("\n" + "=" * 80)
    print(" 비디오 분석 결과")
    print("=" * 80)
    
    print(f"\n 요약:")
    print(f"  {result['summary']}")
    
    print(f"\n 태그:")
    for tag in result['tags']:
        print(f"  • {tag}")
    
    print(f"\n 카테고리:")
    print(f"  {result['category']}")
    
    print("\n" + "=" * 80)
    
    # JSON 형식으로도 출력
    print("\n JSON 형식:")
    print(json.dumps(result, ensure_ascii=False, indent=2))
    print()


def main():
    """메인 함수"""
    parser = argparse.ArgumentParser(
        description='Gemini를 사용하여 비디오를 분석합니다.',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
사용 예시:
  # 로컬 비디오 분석
  %(prog)s --file /path/to/video.mp4
  
  # S3 비디오 분석
  %(prog)s --s3 --bucket my-bucket --key videos/sample.mp4
  
  # 커스텀 모델 사용
  %(prog)s --file /path/to/video.mp4 --model gemini-1.5-pro
        """
    )
    
    # 입력 소스 그룹
    source_group = parser.add_mutually_exclusive_group(required=True)
    source_group.add_argument(
        '--file',
        type=str,
        help='분석할 로컬 비디오 파일 경로'
    )
    source_group.add_argument(
        '--s3',
        action='store_true',
        help='S3에서 비디오를 가져옵니다'
    )
    
    # S3 관련 인자
    parser.add_argument(
        '--bucket',
        type=str,
        help='S3 버킷 이름 (--s3와 함께 사용)'
    )
    parser.add_argument(
        '--key',
        type=str,
        help='S3 객체 키/경로 (--s3와 함께 사용)'
    )
    
    # 선택적 인자
    parser.add_argument(
        '--model',
        type=str,
        help='사용할 Gemini 모델 이름 (기본값: gemini-flash-lite-latest)'
    )
    parser.add_argument(
        '--output',
        type=str,
        default=DEFAULT_OUTPUT_PATH,
        help=f'결과를 저장할 JSON 파일 경로 (기본값: {DEFAULT_OUTPUT_PATH})'
    )
    parser.add_argument(
        '--verbose',
        action='store_true',
        help='상세 로그 출력'
    )
    parser.add_argument(
        '--quiet',
        action='store_true',
        help='콘솔 출력 최소화 (JSON 파일만 생성)'
    )
    
    args = parser.parse_args()
    
    # 로깅 레벨 설정
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    elif args.quiet:
        logging.getLogger().setLevel(logging.WARNING)
    
    # S3 옵션 검증
    if args.s3 and (not args.bucket or not args.key):
        parser.error("--s3를 사용할 때는 --bucket과 --key가 필요합니다.")
    
    try:
        # 비디오 분석 실행
        if args.file:
            result = analyze_local_video(args.file, args.model)
            video_source = {
                'type': 'local',
                'file_path': args.file
            }
        else:
            result = analyze_s3_video(args.bucket, args.key, args.model)
            video_source = {
                'type': 's3',
                'bucket': args.bucket,
                'key': args.key,
                's3_uri': f's3://{args.bucket}/{args.key}'
            }
        
        # 결과를 JSON 파일로 저장 (항상 실행, 누적 방식)
        save_result(result, args.output, video_source)
        
        # 콘솔 출력 (--quiet 옵션이 없을 때만)
        if not args.quiet:
            print_result(result)
        
        return 0
        
    except KeyboardInterrupt:
        logger.info("\n사용자에 의해 중단되었습니다.")
        return 130
        
    except Exception as e:
        logger.error(f"오류 발생: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
