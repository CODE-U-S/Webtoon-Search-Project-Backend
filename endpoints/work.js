const express = require('express');
const router = express.Router();
const pool = require('../database/database');

// 작품 검색 API
router.get('/', async (req, res) => {
    try {
        // 키워드를 추출합니다.
        const keywords = req.query.keyword;

        // 유효성 검사
        if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
            return res.status(400).json({ message: "Keywords are required and must be provided as an array" });
        }

        // 데이터베이스에서 키워드를 포함하는 작품 검색
        let query = `SELECT * FROM work WHERE `;
        for (let i = 0; i < keywords.length; i++) {
            query += `(title LIKE '%${keywords[i]}%' 
                      OR author LIKE '%${keywords[i]}%' 
                      OR genre LIKE '%${keywords[i]}%' 
                      OR day LIKE '%${keywords[i]}%' 
                      OR service LIKE '%${keywords[i]}%')`;
            if (i !== keywords.length - 1) {
                query += ' AND ';
            }
        }

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

