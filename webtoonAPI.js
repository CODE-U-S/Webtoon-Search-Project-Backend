const axios = require('axios');

const webtoonAPI = 'https://korea-webtoon-api.herokuapp.com';
const webtoonSearch = 'https://korea-webtoon-api.herokuapp.com/search';

/*
----------------------------------------
Webtoon API 사용법 - https://github.com/HyeokjaeLee/korea-webtoon-api?tab=readme-ov-file
----------------------------------------
page - 페이지 번호
perPage - 한 페이지 결과 수
service - 웹툰 공급자
    ㄴ naver
    ㄴ kakao
    ㄴ kakaoPage
updateDay - 웹툰 업데이트 구분
    ㄴ mon
    ㄴ tue
    ㄴ wed
    ㄴ thu
    ㄴ fri
    ㄴ sat
    ㄴ sun
    ㄴ finished (완결)
    ㄴ naverDaily (네이버 데일리+)
keyword - 키워드를 포함한 제목, 작가를 가진 웹툰 정보 제공
    (대소문자&특수문자 구분x, 기본 api뒤에 /search 붙이기)
*/