"""
S3 연결 및 Presigned URL 생성 모듈
"""
import logging
from typing import Optional

import boto3
from botocore.exceptions import ClientError, NoCredentialsError

logger = logging.getLogger(__name__)


class S3Connector:
    """S3 객체에 대한 Presigned URL을 생성하는 클래스"""
    
    # 기본 설정
    DEFAULT_EXPIRATION = 7200  # 2시간
    
    def __init__(self, region_name: Optional[str] = None):
        """
        S3 클라이언트 초기화
        
        Args:
            region_name: AWS 리전 (None일 경우 환경 변수 또는 기본 리전 사용)
        
        Raises:
            NoCredentialsError: AWS 자격 증명이 설정되지 않은 경우
        """
        try:
            self.s3_client = boto3.client('s3', region_name=region_name)
            logger.info("S3 클라이언트 초기화 완료")
        except NoCredentialsError:
            logger.error("AWS 자격 증명을 찾을 수 없습니다")
            raise

    def generate_presigned_url(
        self, 
        bucket_name: str, 
        object_key: str, 
        expiration: int = DEFAULT_EXPIRATION
    ) -> str:
        """
        S3 객체에 대한 Presigned URL을 생성
        
        Args:
            bucket_name: S3 버킷 이름
            object_key: S3 객체 키 (파일 경로)
            expiration: URL 유효 시간 (초 단위, 기본값: 7200초 = 2시간)
        
        Returns:
            str: Presigned URL
            
        Raises:
            ClientError: S3 작업 중 오류가 발생한 경우
            ValueError: 잘못된 매개변수가 전달된 경우
        """
        if not bucket_name or not object_key:
            raise ValueError("bucket_name과 object_key는 필수 항목입니다")
        
        if expiration <= 0:
            raise ValueError("expiration은 양수여야 합니다")
        
        logger.info(f"Presigned URL 생성 중: s3://{bucket_name}/{object_key} (유효시간: {expiration}초)")
        
        try:
            presigned_url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': bucket_name, 'Key': object_key},
                ExpiresIn=expiration
            )
            logger.info("Presigned URL 생성 완료")
            return presigned_url
            
        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code', 'Unknown')
            logger.error(f"Presigned URL 생성 실패 [에러 코드: {error_code}]: {e}")
            raise
