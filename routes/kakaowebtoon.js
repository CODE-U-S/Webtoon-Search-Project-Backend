const express = require('express');
const axios = require('axios');
const pool = require('../database/database'); // 데이터베이스 모듈 로드

const router = express.Router(); // express의 라우터 객체 생성

// MySQL에 데이터를 삽입하는 함수
async function insertWebtoonsToDB(webtoons) {
    const query = 'INSERT INTO work (title, author, genre, href, imageUrl, day, service) VALUES ?';
    const values = webtoons.map(webtoon => [
        webtoon.title,
        webtoon.author,
        '표시없음', // 장르 정보가 없는 경우 "표시없음"으로 설정
        webtoon.url,
        webtoon.img,
        webtoon.updateDays.join(','), // updateDays 배열을 문자열로 변환하여 저장
        webtoon.service
    ]);

    return new Promise((resolve, reject) => {
        pool.query(query, [values], (error, results, fields) => { // 값을 괄호로 묶어줌
            if (error) {
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}

// '/webtoons/download' 엔드포인트
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
