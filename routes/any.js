const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const pool = require('../database/database'); // 데이터베이스 모듈 로드

const router = express.Router(); // 라우터 객체 생성

// 웹 페이지에서 HTML을 가져오는 함수
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
            'mon': 'https://www.anytoon.co.kr/webtoon/series/mon',
            'tue': 'https://www.anytoon.co.kr/webtoon/series/tue',
            'wed': 'https://www.anytoon.co.kr/webtoon/series/wed',
            'thr': 'https://www.anytoon.co.kr/webtoon/series/thr',
            'fri': 'https://www.anytoon.co.kr/webtoon/series/fri',
            'sat': 'https://www.anytoon.co.kr/webtoon/series/sat',
            'sun': 'https://www.anytoon.co.kr/webtoon/series/sun',
            'new': 'https://www.anytoon.co.kr/webtoon/series/new'
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

// API 엔드포인트
router.get('/:day?', async (req, res) => {
    try {
        // 클라이언트에서 전달된 요일(day) 파라미터
        const day = req.params.day;

        // 데이터베이스에서 요일에 따른 애니툰 웹툰 목록 가져오기
        let query = 'SELECT * FROM work where service = "any"';

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

// 웹 페이지에서 데이터 가져오는 함수
async function fetchData(url, day) {
    const html = await fetchHTML(url);
    const $ = cheerio.load(html);
    const webtoonList = $('.webtoon-list li');
    const resultList = [];
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

        // 결과 배열에 추가
        resultList.push({
            Sequence: sequence++, // Sequence 값 증가
            href,
            imageUrl,
            title,
            genre,
            author,
            service: "any",
            day // 요일 정보 추가
        });
    }
    return resultList;
}

module.exports = router;
