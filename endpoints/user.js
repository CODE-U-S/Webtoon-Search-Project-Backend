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
        const query = 'INSERT INTO user (name, user_id, password) VALUES (?, ?, ?)';
        
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
        // 쿼리 기본 템플릿
        let query = 'SELECT * FROM user';

        // URL 쿼리 파라미터에서 조건을 추출합니다.
        const { id, name } = req.query;

        // 조건이 존재할 경우 WHERE 구문 추가
        if (id) {
            query += ` WHERE user_id = '${id}'`;
        } else if (name) {
            query += ` WHERE name = '${name}'`;
        }

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

// 유저 삭제 api
router.delete('/delete', async (req, res) => {
    try {
        const userId = req.query.id;

        // 유효성 검사
        if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
        }

        // 데이터베이스에서 삭제할 유저를 찾는 쿼리
        const query = 'DELETE FROM user WHERE user_id = ?';

        // 데이터베이스에서 유저 삭제
        pool.query(query, [userId], (error, results, fields) => {
            if (error) {
                console.error('Error deleting user:', error);
                return res.status(500).json({ message: "Internal Server Error" });
            }

            // 삭제된 유저가 없는 경우
            if (results.affectedRows === 0) {
                return res.status(404).json({ message: "User not found" });
            }
            
            res.status(200).json({ message: "User deleted successfully" });
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// 로그인 api
router.post('/login', async (req, res) => {
    try {
        const { user_id, password } = req.body;

        // 유효성 검사
        if (!user_id || !password) {
            return res.status(400).json({ message: "User ID and password are required" });
        }

        // 데이터베이스에서 사용자 조회
        const query = 'SELECT * FROM user WHERE user_id = ?';
        pool.query(query, [user_id], (error, results, fields) => {
            if (error) {
                console.error('Error retrieving user:', error);
                return res.status(500).json({ message: "Internal Server Error" });
            }

            // 사용자가 존재하지 않는 경우
            if (results.length === 0) {
                return res.status(404).json({ message: "User not found" });
            }

            const user = results[0];

            // 비밀번호 확인
            if (user.password !== password) {
                return res.status(401).json({ message: "Incorrect password" });
            }

            // 로그인 성공
            res.status(200).json({ message: "Login successful" });
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});



module.exports = router;
