# 빌드 스테이지
FROM eclipse-temurin:17-jdk-jammy AS builder
WORKDIR /app

COPY back-end/ .

RUN chmod +x ./gradlew
RUN ./gradlew build -x test

# 실행 스테이지
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# python, uv 설치
RUN apt-get update && apt-get install -y python3 python3-venv && rm -rf /var/lib/apt/lists/*
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

COPY --from=builder /app/build/libs/*.jar app.jar
COPY python_modules/ /python_modules/

# 가상환경이랑 의존성 설치
ENV VIRTUAL_ENV=/python_modules/.venv
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

WORKDIR /python_modules
RUN uv sync --frozen
WORKDIR /app

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
