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
// API 엔드포인트
router.get('/:day?', async (req, res) => {
    try {
        // 클라이언트에서 전달된 요일(day) 파라미터
        const day = req.params.day;

        // 데이터베이스에서 요일에 따른 애니툰 웹툰 목록 가져오기
        let query = 'SELECT * FROM work where service = "mrblue"';

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
