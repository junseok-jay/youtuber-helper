# 빌드 스테이지
FROM eclipse-temurin:17-jdk-jammy AS builder
WORKDIR /app

COPY back-end/ .

RUN chmod +x ./gradlew
RUN ./gradlew build -x test

# 실행 스테이지
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

RUN apt-get update && apt-get install -y python3 python3-pip

COPY --from=builder /app/build/libs/*.jar app.jar
COPY sentimentAnalyzer/ /sentimentAnalyzer/

RUN pip3 install -r /sentimentAnalyzer/requirements.txt

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
