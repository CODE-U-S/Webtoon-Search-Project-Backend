const express = require('express');
const router = express.Router();
const pool = require('../database/database');

// 회원가입 api
router.post('/signup', async (req, res) => {
    try {
        const { name, user_id, password } = req.body;

        // 유효성 검사
        if (!name || !user_id || !password) {
            return res.status(400).json({ message: "Name, user_id, and password are required" });
        }

        // 데이터베이스에 삽입할 쿼리
        const query = 'INSERT INTO User (name, user_id, password) VALUES (?, ?, ?)';
        
        // 데이터베이스에 데이터 삽입
        pool.query(query, [name, user_id, password], (error, results, fields) => {
            if (error) {
                console.error('Error inserting user:', error);
                return res.status(500).json({ message: "Internal Server Error" });
            }
            
            res.status(201).json({ message: "User created successfully" });
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
// 유저 조회 api
router.get('/', async (req, res) => {
    try {
        // 데이터베이스에서 모든 유저 정보를 가져오는 쿼리
        const query = 'SELECT * FROM User';

        // 데이터베이스에서 유저 정보를 조회
        pool.query(query, (error, results, fields) => {
            if (error) {
                console.error('Error retrieving users:', error);
                return res.status(500).json({ message: "Internal Server Error" });
            }
            
            res.status(200).json(results);
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// 유저 조회(이름, 아이디로,전체)
// 유저 삭제



// 좋아요 수 입력
// 좋아요 수 보기
// 좋아요 수 삭제

// 좋아요 작품 추가
// 좋아요 작품 보기
// 좋아요 작품 삭제





module.exports = router;
