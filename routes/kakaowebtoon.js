const express = require('express');
const axios = require('axios');
const pool = require('../database/database'); // 데이터베이스 모듈 로드

const router = express.Router(); // express의 라우터 객체 생성

// MySQL에서 요일과 키워드를 기반으로 웹툰 목록을 가져오는 함수
async function getWebtoonsByDayAndKeyword(day, keyword) {
    let query = 'SELECT * FROM work WHERE service = "kakao"';

    const queryParams = [];
    if (day) {
        query += ' AND day = ?';
        queryParams.push(day);
    }
    if (keyword) {
        query += ' AND (title LIKE ? OR author LIKE ? OR genre LIKE ?)';
        const likeKeyword = `%${keyword}%`;
        queryParams.push(likeKeyword, likeKeyword, likeKeyword);
    }

    return new Promise((resolve, reject) => {
        pool.query(query, queryParams, (error, results, fields) => {
            if (error) {
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}

// API 엔드포인트 정의
router.get('/:day?', async (req, res) => {
    try {
        const day = req.params.day;
        const keyword = req.query.keyword; // 쿼리 문자열에서 키워드 가져오기

        // 데이터베이스에서 요일과 키워드에 해당하는 웹툰 목록 가져오기
        const webtoons = await getWebtoonsByDayAndKeyword(day, keyword);

        res.json(webtoons); // JSON 형식으로 응답
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
});

// 웹툰 다운로드 엔드포인트
router.get('/download', async (req, res) => {
    try {
        // 각 업데이트 날짜에 해당하는 API 호출
        const updateDays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun', 'finished'];
        const allWebtoons = [];

        for (const day of updateDays) {
            const url = `https://korea-webtoon-api.herokuapp.com/?perPage=100&service=kakao&updateDay=${day}`;
            try {
                const { data } = await axios.get(url);
                allWebtoons.push(...data.webtoons);
            } catch (error) {
                console.error(`Error fetching data for day ${day}:`, error);
                continue; // 오류가 발생했을 경우 다음 작업으로 넘어가기
            }
        }

        // MySQL에 데이터 삽입
        await insertWebtoonsToDB(allWebtoons);

        res.json({ message: 'Data inserted to database successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
