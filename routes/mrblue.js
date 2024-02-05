const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const router = express.Router(); // 라우터 객체 생성

// 웹 페이지에서 HTML을 가져오는 함수
async function fetchHTML(url) {
    const { data } = await axios.get(url);
    return data;
}

// API 엔드포인트
router.get('/:day?', async (req, res) => {
    try {
        // 클라이언트에서 전달된 요일(day) 파라미터
        const day = req.params.day;

        // 각 요일에 대한 URL 매핑
        const dayToUrl = {
            'new': 'https://www.mrblue.com/webtoon/new#list',
            'mon': 'https://www.mrblue.com/webtoon/mon#list',
            'tue': 'https://www.mrblue.com/webtoon/tue#list',
            'wed': 'https://www.mrblue.com/webtoon/wed#list',
            'thu': 'https://www.mrblue.com/webtoon/thu#list',
            'fri': 'https://www.mrblue.com/webtoon/fri#list',
            'sat': 'https://www.mrblue.com/webtoon/sat#list',
            'sun': 'https://www.mrblue.com/webtoon/sun#list',
            'tenday': 'https://www.mrblue.com/webtoon/tenday#list',
        };

        // 요일이 주어지지 않은 경우 모든 요일의 데이터를 가져옴
        if (!day) {
            const allDaysData = [];
            // 모든 요일에 대해 반복
            for (const dayKey in dayToUrl) {
                const url = dayToUrl[dayKey];
                const dayData = await fetchData(url, dayKey); // fetchData 함수 호출 (요일 정보 전달)
                allDaysData.push(...dayData); // 결과 데이터 배열에 추가
            }
            res.json(allDaysData); // 전체 데이터를 JSON 형식으로 응답
        } else {
            // 지정된 요일에 해당하는 URL 가져오기
            const url = dayToUrl[day];
            // HTML 가져오기
            const dayData = await fetchData(url, day); // fetchData 함수 호출 (요일 정보 전달)
            res.json(dayData); // 해당 요일의 데이터를 JSON 형식으로 응답
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
});

// 웹 페이지에서 데이터 가져오는 함수
async function fetchData(url, day) {
    const html = await fetchHTML(url); // 웹 페이지 HTML 가져오기
    const $ = cheerio.load(html); // Cheerio를 사용하여 HTML 파싱
    const listItems = $('li'); // 웹 페이지에서 리스트 아이템 선택
    const resultList = []; // 결과를 담을 배열 초기화
    let sequence = 1; // Sequence 값을 초기화

    listItems.each((index, element) => {
        // adultmark 클래스를 포함하지 않는 경우에만 처리
        if (!$(element).find('.img.adultmark').length) {
            const imgElement = $(element).find('.img'); // 이미지 요소 선택
            const href = "https://www.mrblue.com" + imgElement.find('a').attr('href'); // 링크 URL 생성
            const imageUrl = imgElement.find('img').attr('data-original'); // 이미지 URL 가져오기

            const txtBoxElement = $(element).find('.txt-box'); // 텍스트 상자 요소 선택
            const title = txtBoxElement.find('.tit a').attr('title'); // 타이틀 가져오기

            const genreElement = txtBoxElement.find('.name span a').eq(0); // 장르 요소 선택
            if (!genreElement.length) {
                return; // genre가 없으면 반복 중단
            }
            const genre = genreElement.text(); // 장르 텍스트 가져오기

            const author = txtBoxElement.find('.name a').eq(1).text(); // 작가 정보 가져오기

            const service = "mrblue"; // 서비스 정보 설정

            // 결과 배열에 객체 추가
            resultList.push({
                Sequence: sequence++, // Sequence 값 증가
                href,
                imageUrl,
                title,
                genre,
                author,
                service: "mrblue",
                day // 요일 정보 추가
            });
        }
    });

    return resultList; // 결과 배열 반환
}

module.exports = router; // 라우터 객체 내보내기
