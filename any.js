const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const port = 3000;

// 웹 페이지에서 HTML을 가져오는 함수
async function fetchHTML(url) {
    const { data } = await axios.get(url);
    return data;
}

// API 엔드포인트
app.get('/:day', async (req, res) => {
    // 클라이언트에서 전달된 요일(day) 파라미터
    const day = req.params.day;

    // 요일에 따른 애니툰 웹툰 목록 페이지 URL
    const dayToUrl = {
        'mon': 'https://www.anytoon.co.kr/webtoon/series/mon',
        'tue': 'https://www.anytoon.co.kr/webtoon/series/tue',
        'wed': 'https://www.anytoon.co.kr/webtoon/series/wed',
        'thr': 'https://www.anytoon.co.kr/webtoon/series/thr',
        'fri': 'https://www.anytoon.co.kr/webtoon/series/fri',
        'sat': 'https://www.anytoon.co.kr/webtoon/series/sat',
        'sun': 'https://www.anytoon.co.kr/webtoon/series/sun',
        'new': 'https://www.anytoon.co.kr/webtoon/series/new'
    };

    // 지정된 요일에 해당하는 URL 가져오기
    const url = dayToUrl[day];

    try {
        // HTML 가져오기
        const html = await fetchHTML(url);

        // Cheerio를 사용하여 HTML 파싱
        const $ = cheerio.load(html);

        // 웹툰 목록을 담고 있는 요소 선택
        const webtoonList = $('.webtoon-list li');

        // 결과를 저장할 배열
        const resultList = [];

        // 각 웹툰 요소에 대해 반복
        let sequence = 1; // Sequence 값을 초기화

        for (let i = 0; i < webtoonList.length; i++) {
            const element = webtoonList[i];
            // 현재 요소에서 필요한 정보 추출
            const imageUrl = $(element).find('.thumb-img img').attr('data-srcset');
            const link = $(element).find('a').attr('href');
            const webtoonId = link.match(/\d+/)[0]; // 링크에서 숫자 부분 추출
            const href = `https://www.anytoon.co.kr/webtoon/episode/${webtoonId}`;
            const title = $(element).find('.info-box p').text(); // thumb-title 정보 가져오기
            const genre = $(element).find('.thumb-info .tag-genre').text(); // tag-genre 정보 가져오기

            // 웹툰 상세 페이지에서 작가 정보 가져오기
            const webtoonHtml = await fetchHTML(href);
            const $webtoon = cheerio.load(webtoonHtml);
            const author = $webtoon('.thumb-info .tag-writer').text(); // 작가 정보 가져오기

            const service = "anytoon";
            // 결과 배열에 추가
            resultList.push({
                Sequence: sequence++, // Sequence 값 증가
                href,
                imageUrl,
                title,
                genre,
                author,
                service,
            });
        }

        // 추출한 정보를 응답
        res.json(resultList);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
});

// 서버 시작
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
