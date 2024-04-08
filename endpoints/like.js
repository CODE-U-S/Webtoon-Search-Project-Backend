const express = require('express');
const router = express.Router();
const pool = require('../database/database');

//작품의 좋아요 추가(good_work 테이블) *완료*
router.post('/new', async (req, res) => {
    try {
        const { user_id, user, work, imageUrl, href } = req.body;

        // 현재 날짜의 년도, 월, 날짜 가져오기
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth()+1).padStart(2, '0');
        const date = String(today.getDate()).padStart(2, '0');
  
        // 데이터베이스에 삽입할 쿼리
        const query = `
            INSERT INTO good_work (user_id, user, work, imageUrl, href, start_day)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
  
        // 데이터베이스에 데이터 삽입
        pool.query(query, [user_id, user, work, imageUrl, href, `${year}${month}${date}`], (error, results) => {
            if (error) {
                console.error('Error inserting data:', error);
                return res.status(500).json({ message: "Internal Server Error" });
            }
  
            console.log('Data inserted successfully.');
            res.status(201).json({ message: "Data inserted successfully" });
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});


  
  //작품의 좋아요 수 보기 *완료*
  router.get('/workcount/:work', async (req, res) => {
    try {
        const { work } = req.params;
  
        // 데이터베이스에서 해당 work의 개수 조회 쿼리 작성
        const query = "SELECT COUNT(work) AS work_count FROM good_work WHERE work = ?";
  
        // 데이터베이스에서 해당 work의 개수 조회
        pool.query(query, [work], (error, results) => {
            if (error) {
                console.error('Error retrieving work count:', error);
                return res.status(500).json({ message: "Internal Server Error" });
            }
  
            // 조회 결과를 응답으로 보냄
            res.status(200).json(results[0]);
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: "Internal Server Error" });
    }
  });
  
  //좋아요 작품 삭제
  router.delete('/deleterecord', async (req, res) => {
      try {
          const { user_id, user, work } = req.body;
  
          // 쿼리문 작성
          const query = "DELETE FROM good_work WHERE user_id = ? AND user = ? AND work = ?";
  
          // 데이터베이스에서 레코드 삭제
          pool.query(query, [user_id, user, work], (error, results) => {
              if (error) {
                  console.error('Error deleting record:', error);
                  return res.status(500).json({ message: "Internal Server Error" });
              }
  
              // 삭제된 레코드의 수가 0인 경우
              if (results.affectedRows === 0) {
                  return res.status(404).json({ message: "Record not found" });
              }
  
              // 삭제가 성공적으로 이루어진 경우
              res.status(200).json({ message: "deleted successfully" });
          });
      } catch (error) {
          console.error('Error:', error);
          res.status(500).json({ message: "Internal Server Error" });
      }
  });

router.get('/', async (req, res) => {
    try {
        // 쿼리 기본 템플릿
        let query = 'SELECT work, imageUrl, href, start_day FROM good_work';

        // URL 쿼리 파라미터에서 조건을 추출합니다.
        const { id } = req.query;

        // 조건이 존재할 경우 WHERE 구문 추가
        if (id) {
            query += ` WHERE user_id = '${id}'`;
        }

        // 데이터베이스에서 좋아하는 작품의 리스트 조회
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

module.exports = router;