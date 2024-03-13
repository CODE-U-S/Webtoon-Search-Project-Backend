const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const pool = require('../database/database'); // 데이터베이스 모듈 로드

const router = express.Router(); // express의 라우터 객체 생성

// HTML을 가져오는 함수 정의
async function fetchHTML(url) {
    const { data } = await axios.get(url);
    return data;
}

// 데이터를 DB에 삽입하는 api
async function insertDataToDB(data) {
    const query = 'INSERT INTO work (title, author, genre, href, imageUrl, day, service) VALUES ?';
    const values = data.map(item => [item.title, item.author, item.genre, item.href, item.imageUrl, item.day, item.service]);

    return new Promise((resolve, reject) => {
        pool.query(query, [values], (error, results, fields) => {
            if (error) {
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}

// '/mrblue/download' 엔드포인트
router.get('/download', async (req, res) => {
    try {
        const dayToUrl = {
            'mon': 'https://ridibooks.com/group-tab/2491/1',
            'tue': 'https://ridibooks.com/group-tab/2491/2',
            'wed': 'https://ridibooks.com/group-tab/2491/3',
            'thr': 'https://ridibooks.com/group-tab/2491/4',
            'fri': 'https://ridibooks.com/group-tab/2491/5',
            'sat': 'https://ridibooks.com/group-tab/2491/6',
            'sun': 'https://ridibooks.com/group-tab/2491/7'
        };

        const allDaysData = [];
        for (const dayKey in dayToUrl) {
            const url = dayToUrl[dayKey];
            const dayData = await fetchData(url, dayKey);
            allDaysData.push(...dayData);
        }

        // 데이터를 DB에 삽입
        await insertDataToDB(allDaysData);

        res.json({ message: 'Data inserted to database successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
});

// API 엔드포인트 정의
router.get('/:day?', async (req, res) => {
    try {
        // 클라이언트에서 전달된 요일(day) 파라미터
        const day = req.params.day;

        // 데이터베이스에서 요일에 따른 애니툰 웹툰 목록 가져오기
        let query = 'SELECT * FROM work where service = "ridi"';

        // 요일이 지정된 경우 해당 요일에 해당하는 데이터만 가져오도록 SQL 쿼리 수정
        if (day) {
            query += ' WHERE day = ?';
        }

        // 데이터베이스에서 데이터 가져오기
        pool.query(query, [day], async (error, results, fields) => {
            if (error) {
                console.error('Error:', error);
                res.status(500).send('Internal Server Error');
                return;
            }

            res.json(results); // 요청된 요일에 해당하는 데이터 또는 전체 데이터를 JSON 형식으로 응답
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
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
