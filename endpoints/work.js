const express = require('express');
const router = express.Router();
const pool = require('../database/database');

// 작품 검색 API
router.get('/', async (req, res) => {
    try {
        // 키워드를 배열로 변환합니다.
        const keywords = Array.isArray(req.query.keyword) ? req.query.keyword : [req.query.keyword];

        // 유효성 검사
        if (!keywords || keywords.length === 0) {
            return res.status(400).json({ message: "At least one keyword is required" });
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

// 작품 ID를 기반으로 작품 검색 API
router.get('/id=:id', async (req, res) => {
    try {
        const id = req.params.id;

        // 데이터베이스에서 작품 ID를 기반으로 작품 검색
        const query = `SELECT * FROM work WHERE id = ${id}`;

        // 작품 검색
        pool.query(query, (error, results, fields) => {
            if (error) {
                console.error('Error searching for work by ID:', error);
                return res.status(500).json({ message: "Internal Server Error" });
            }

            if (results.length === 0) {
                return res.status(404).json({ message: "Work not found" });
            }

            res.status(200).json(results[0]);
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

module.exports = router;
