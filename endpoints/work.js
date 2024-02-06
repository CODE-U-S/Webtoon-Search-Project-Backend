const express = require('express');
const router = express.Router();
const pool = require('../database/database');

// 작품 검색 API
router.get('/', async (req, res) => {
    try {
        // 키워드를 추출합니다.
        const keyword = req.query.keyword;

        // 유효성 검사
        if (!keyword) {
            return res.status(400).json({ message: "Keyword is required" });
        }

        // 데이터베이스에서 키워드를 포함하는 작품 검색
        const query = `SELECT * FROM work 
                       WHERE title LIKE '%${keyword}%' 
                          OR author LIKE '%${keyword}%' 
                          OR genre LIKE '%${keyword}%' 
                          OR day LIKE '%${keyword}%' 
                          OR service LIKE '%${keyword}%'`;

        // 작품 검색
        pool.query(query, (error, results, fields) => {
            if (error) {
                console.error('Error searching for works:', error);
                return res.status(500).json({ message: "Internal Server Error" });
            }

            res.status(200).json(results);
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

module.exports = router;


// 리디북스
// 미스터블루
// 애니툰


// 네이버웹툰
// 카카오 웹툰
// 카카오페이지

