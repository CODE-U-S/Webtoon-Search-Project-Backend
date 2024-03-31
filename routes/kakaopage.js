const express = require('express');
const axios = require('axios');
const pool = require('../database/database'); // 데이터베이스 모듈 로드

const router = express.Router(); // express의 라우터 객체 생성

// 요일 및 키워드를 기반으로 데이터베이스에서 웹툰 목록을 가져오는 함수
async function getWebtoonsByDayAndKeyword(day, keyword) {
    let query = 'SELECT * FROM work WHERE service = "kakaoPage"';

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
        const keyword = req.query.keyword;

        // 데이터베이스에서 요일과 키워드에 해당하는 웹툰 목록 가져오기
        const webtoons = await getWebtoonsByDayAndKeyword(day, keyword);

        res.json(webtoons); // JSON 형식으로 응답
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;

