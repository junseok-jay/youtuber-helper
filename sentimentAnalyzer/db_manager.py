"""
PostgreSQL 데이터베이스 연결 및 채팅 데이터 가져오기 모듈
"""

import os
from typing import List, Optional
import psycopg2
from psycopg2 import sql


class DatabaseManager:
    """PostgreSQL 데이터베이스 관리 클래스"""

    def __init__(
        self,
        host: str = None,
        port: int = None,
        database: str = None,
        user: str = None,
        password: str = None
    ):
        """
        Args:
            (none일 경우 환경변수에서 가져옴)
            host: DB 호스트 
            port: DB 포트 
            database: DB 이름
            user: DB 사용자명 
            password: DB 비밀번호 
        """
        self.host = host or os.getenv('DB_HOST', 'localhost')
        self.port = port or int(os.getenv('DB_PORT', '5432'))
        self.database = database or os.getenv('DB_NAME')
        self.user = user or os.getenv('DB_USER')
        self.password = password or os.getenv('DB_PASSWORD')

        if not all([self.database, self.user, self.password]):
            raise ValueError("데이터베이스 연결 정보가 완전하지 않습니다. DB_NAME, DB_USER, DB_PASSWORD를 확인하세요.")

        self.connection = None

    def connect(self):
        """데이터베이스 연결"""
        try:
            self.connection = psycopg2.connect(
                host=self.host,
                port=self.port,
                database=self.database,
                user=self.user,
                password=self.password
            )
            print(f"데이터베이스 '{self.database}'에 성공적으로 연결되었습니다.")
        except psycopg2.Error as e:
            raise ConnectionError(f"데이터베이스 연결 실패: {e}")

    def disconnect(self):
        """데이터베이스 연결 종료"""
        if self.connection:
            self.connection.close()
            print("데이터베이스 연결이 종료되었습니다.")

    def fetch_messages(
        self,
        table_name: str = 'youtube_comments',
        message_column: str = 'text',
        limit: Optional[int] = None,
        where_clause: str = None
    ) -> List[str]:
        """
        데이터베이스에서 채팅 메시지만 가져오기

        Args:
            table_name: 테이블 이름 (기본값: 'youtube_comments')
            message_column: 메시지 컬럼명 (기본값: 'text')
            limit: 가져올 메시지 수 제한 (None일 경우 전체)
            where_clause: WHERE 조건절 (예: "published_at > '2025-01-01T10:20:30Z'")

        Returns:
            메시지 문자열 리스트
        """
        if not self.connection:
            raise ConnectionError("데이터베이스에 연결되지 않았습니다. connect()를 먼저 호출하세요.")

        try:
            cursor = self.connection.cursor()

            # SQL 쿼리 구성
            query = sql.SQL("SELECT {column} FROM {table}").format(
                column=sql.Identifier(message_column),
                table=sql.Identifier(table_name)
            )

            # WHERE 절 추가
            if where_clause:
                query = sql.SQL("{query} WHERE {where}").format(
                    query=query,
                    where=sql.SQL(where_clause)
                )

            # LIMIT 추가
            if limit:
                query = sql.SQL("{query} LIMIT {limit}").format(
                    query=query,
                    limit=sql.Literal(limit)
                )

            cursor.execute(query)
            results = cursor.fetchall()
            cursor.close()

            # 메시지만 추출 (튜플에서 첫 번째 요소)
            messages = [row[0] for row in results if row[0]]  # None이나 빈 값 제외

            print(f"{len(messages)}개의 메시지를 가져왔습니다.")
            return messages

        except psycopg2.Error as e:
            raise RuntimeError(f"메시지 조회 중 오류 발생: {e}")

    def __enter__(self):
        """with 문 지원"""
        self.connect()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """with 문 종료 시 자동 연결 해제"""
        self.disconnect()
