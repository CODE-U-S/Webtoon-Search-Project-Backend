const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const router = express.Router(); // express의 라우터 객체 생성

// HTML을 가져오는 함수 정의
async function fetchHTML(url) {
    const { data } = await axios.get(url);
    return data;
}

// API 엔드포인트 정의
router.get('/:day?', async (req, res) => {
    try {
        const day = req.params.day;
        const dayToUrl = {
            'mon': 'https://ridibooks.com/group-tab/2491/1',
            'tue': 'https://ridibooks.com/group-tab/2491/2',
            'wed': 'https://ridibooks.com/group-tab/2491/3',
            'thr': 'https://ridibooks.com/group-tab/2491/4',
            'fri': 'https://ridibooks.com/group-tab/2491/5',
            'sat': 'https://ridibooks.com/group-tab/2491/6',
            'sun': 'https://ridibooks.com/group-tab/2491/7'
        };

        // 요일이 주어지지 않은 경우 모든 요일의 URL 가져오기
        if (!day) {
            const allDaysData = [];
            for (const dayKey in dayToUrl) {
                const url = dayToUrl[dayKey];
                const dayData = await fetchData(url, dayKey);
                allDaysData.push(...dayData);
            }
            res.json(allDaysData);
        } else {
            // 주어진 요일에 해당하는 URL 가져오기
            const url = dayToUrl[day];
            // 데이터 가져오기
            const dayData = await fetchData(url, day);
            res.json(dayData); // 해당 요일의 데이터를 JSON 형식으로 응답
        }
    } catch (error) {
        console.error('오류:', error);
        res.status(500).send('내부 서버 오류');
    }
});

// 웹 페이지에서 데이터를 가져오는 함수
async function fetchData(url, day) {
    const html = await fetchHTML(url);
    const $ = cheerio.load(html);
    const webtoonList = $('.fig-pxcu15.ekd5yyf0 li'); // 웹툰 목록을 담고 있는 요소 선택
    const resultList = [];
    let sequence = 1; // 시퀀스 값을 초기화

    // 웹툰 목록을 반복하며 데이터 추출
    for (let i = 0; i < webtoonList.length; i++) {
        const element = webtoonList[i];
        // 필요한 정보 추출
        const titleElement = $(element).find('.fig-lk4798 .fig-3h0c1x div:first-child a');
        const title = titleElement.text();
        const href = 'https://ridibooks.com' + titleElement.attr('href'); // 상세 페이지 링크

        const authorsElement = $(element).find('.fig-lk4798 .fig-3h0c1x div:last-child p:first-child a');
        const author = authorsElement.map((index, el) => $(el).text()).get().join(', '); // 작가 정보

        try {
            // 상세 페이지 HTML 가져오기
            const detailHtml = await fetchHTML(href);
            const $detail = cheerio.load(detailHtml);

            // "19세 미만 구독불가"가 포함된 요소는 무시
            const isRestricted = $detail('[aria-label="19세 미만 구독불가"]').length > 0;
            if (isRestricted) {
                continue; // 현재 반복 중단
            }

            // 이미지 URL 추출
            const thumbnailImage = $detail('.thumbnail_image');
            const imgTag = thumbnailImage.find('.thumbnail');
            const imageUrl = imgTag.attr('data-src');

            // 장르 정보 추출
            const genreElement = $detail('.header_info_wrap .info_category_wrap a:last-child');
            const genre = genreElement.text();

            // 결과 배열에 추가
            resultList.push({
                Sequence: sequence++, // 시퀀스 값 증가
                href,
                imageUrl,
                title,
                genre,
                author,
                service: "ridi",
                day // 요일 정보 추가
            });
        } catch (error) {
            console.error('상세 페이지 가져오기 오류:', error);
            continue;
        }
    }
    return resultList;
}

module.exports = router;
