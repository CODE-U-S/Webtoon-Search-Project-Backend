const express = require('express');
const router = express.Router();
const { promisify } = require('util');
const pool = require('../database/database');
const queryAsync = promisify(pool.query).bind(pool);

// 리뷰 달기 API
router.post('/write', async (req, res) => {
    try {
        // 작품이름, 평점, 아이디, 댓글
        const { title, rating, user_id, comment } = req.body;

        // 유효성 검사
        if (!title || !rating || !user_id || !comment) {
            return res.status(400).json({ message: "작품이름, 평점, 아이디, 댓글을 전부 작성해 주세요." });
        } else if (comment.length > 50) {
            return res.status(400).json({ message: "댓글은 50글자 이내로 작성해 주세요." });
        } else if (rating > 5 || rating < 0) {
            return res.status(400).json({ message: "평점은 1점에서 5점까지만 가능합니다." });
        }

        // 유저 유효성 검사 - 등록된 유저인가?
        let userValidationQuery = 'SELECT user_id FROM user WHERE user_id = ?';
        const [registered_user_result, registered_user_fields] = await queryAsync(userValidationQuery, [user_id]);
        if (registered_user_result === undefined) {
            // 유저가 없을 경우
            return res.status(400).json({ message: "등록된 유저가 아닙니다." });
        }
        // 유저 유효성 검사 - 이미 작성된 리뷰가 있는가?
        userValidationQuery = 'SELECT user_id FROM review WHERE user_id = ?';
        const [written_review_results, written_review_fields] = await queryAsync(userValidationQuery, [user_id]);
        if (written_review_results !== undefined) {
            // 유저가 없을 경우
            return res.status(400).json({ message: "이미 리뷰를 작성한 유저입니다." });
        }

        // DB 쿼리
        const query = "INSERT INTO review (work_name, rating, user_id, comment) VALUES (?, ?, ?, ?)";

        // DB 데이터 삽입
        await queryAsync(query, [title, rating, user_id, comment]);

        res.status(201).json({ message: "성공적으로 끝마쳤습니다!" });

    } catch (error) {
        console.error("에러 발생 : " + error);
        res.status(500).json({ message: "에러가 발생하였습니다." });
    }
});

// 리뷰 모아보기 api
router.get('/', async (req, res) => {
    try{
        //DB 쿼리
        let query = 'SELECT * FROM review';

        //조건 추가
        const { title } = req.query;

        //조건이 존재할 경우
        if(title){
            query += ` WHERE work_name = '${title}'`;
        }

        //DB에서 리뷰정보 조회
        pool.query(query, (error, results, fields) => {
            if(error){
                console.error('Error retrieving users:', error);
                return res.status(500).json({ message: "Internal Server Error" });
            }

            res.status(200).json(results);
        });
    } catch (error) {
        console.error("에러 발생 : " + error);
        res.status(500).json({ message: "에러가 발생하였습니다." });
    }
});

module.exports = router;
