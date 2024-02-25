const express = require('express');
const router = express.Router();
const { promisify } = require('util');
const pool = require('../database/database');
const queryAsync = promisify(pool.query).bind(pool);

// 리뷰 달기 $ 리뷰 수정 API
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

        //리뷰 수정 api(else문은 리뷰 작성 부분)
        // 유저 유효성 검사 - 이미 작성된 리뷰가 있는가? -> 있다면 이 내용으로 수정
        userValidationQuery = 'SELECT user_id FROM review WHERE user_id = ? AND work_name = ?';
        const [written_review_results, written_review_fields] = await queryAsync(userValidationQuery, [user_id, title]);
        if (written_review_results !== undefined) {

            // 수정에 쓸 쿼리
            const modify_query = 'UPDATE review SET comment = ?, rating = ? WHERE user_id = ? AND work_name = ?';

            // DB 데이터 수정
            await queryAsync(modify_query, [comment, rating, user_id, title]);
            res.status(201).json({ message: "리뷰 수정을 성공적으로 끝마쳤습니다!" });

        }else{
            // 리뷰 작성에 쓸 쿼리
            const write_query = "INSERT INTO review (work_name, rating, user_id, comment) VALUES (?, ?, ?, ?)";
    
            // DB 데이터 삽입
            await queryAsync(write_query, [title, rating, user_id, comment]);
            res.status(201).json({ message: "리뷰 작성을 성공적으로 끝마쳤습니다!" });
        }

        //웹툰의 평균 평점 api
        const rating_query = `SELECT rating FROM review WHERE work_name = '${title}'`;
        const aver_rating_query = "UPDATE work SET rating = ? WHERE title = ?";

        const rating_result = await queryAsync(rating_query);
        let aver_rating = 0;
        for(let rate of rating_result){
            aver_rating += rate.rating;
        }
        aver_rating = (aver_rating / rating_result.length).toFixed(2);
        
        await queryAsync(aver_rating_query, [aver_rating, title]);
        console.log("평균 갱신 성공");

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

//리뷰 삭제
router.delete('/delete', async (req, res) => {
    try {
        const { user_id, work_name } = req.query;

        // 쿼리문 작성
        const query = "DELETE FROM review WHERE user_id = ? AND work_name = ?";

        // 데이터베이스에서 해당하는 데이터 삭제
        pool.query(query, [user_id, work_name], (error, results) => {
            if (error) {
                console.error('Error deleting review:', error);
                return res.status(500).json({ message: "Internal Server Error" });
            }

            // 삭제된 행이 없는 경우
            if (results.affectedRows === 0) {
                return res.status(404).json({ message: "유저 아이디나 작품 이름이 올바르지 않습니다." });
            }

            // 삭제 성공
            res.status(200).json({ message: "리뷰가 성공적으로 삭제되었습니다." });
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: "주소를 다시 확인해주세요." });
    }
});

module.exports = router;
