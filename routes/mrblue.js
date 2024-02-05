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
            for (const dayKey in dayToUrl) {
                const url = dayToUrl[dayKey];
                const dayData = await fetchData(url);
                allDaysData.push(...dayData);
            }
            res.json(allDaysData);
        } else {
            // 지정된 요일에 해당하는 URL 가져오기
            const url = dayToUrl[day];
            // HTML 가져오기
            const dayData = await fetchData(url);
            res.json(dayData);
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
});

// 웹 페이지에서 데이터 가져오는 함수
async function fetchData(url) {
    const html = await fetchHTML(url);
    const $ = cheerio.load(html);
    const listItems = $('li');
    const resultList = [];
    let sequence = 1; // Sequence 값을 초기화

    listItems.each((index, element) => {
        if (!$(element).find('.img.adultmark').length) {
            const imgElement = $(element).find('.img');
            const href = "https://www.mrblue.com" + imgElement.find('a').attr('href');
            const imageUrl = imgElement.find('img').attr('data-original');

            const txtBoxElement = $(element).find('.txt-box');
            const title = txtBoxElement.find('.tit a').attr('title');

            const genreElement = txtBoxElement.find('.name span a').eq(0);
            if (!genreElement.length) {
                return; // genre가 없으면 반복 중단
            }
            const genre = genreElement.text();

            const author = txtBoxElement.find('.name a').eq(1).text();

            const service = "mrblue";

            resultList.push({
                Sequence: sequence++, // Sequence 값 증가
                href,
                imageUrl,
                title,
                genre,
                author,
                service: "mrblue"
            });
        }
    });

    return resultList;
}

module.exports = router;
