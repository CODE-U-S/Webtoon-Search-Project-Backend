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

//작품의 좋아요 추가(good_work 테이블) *완료*
router.post('/addgoodwork', async (req, res) => {
  try {
      const { user_id, user, work, imageUrl, href, start_day } = req.body;

      // 데이터베이스에 삽입할 쿼리
      const query = `
          INSERT INTO good_work (user_id, user, work, imageUrl, href, start_day)
          VALUES (?, ?, ?, ?, ?, ?)
      `;

      // 데이터베이스에 데이터 삽입
      pool.query(query, [user_id, user, work, imageUrl, href, start_day], (error, results) => {
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
            res.status(200).json({ message: "Record deleted successfully" });
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});


//좋아요 작품의 리스트 보기
router.get('/getWork/:work', async (req, res) => {
  try {
      const { work } = req.params;

      // 쿼리문 작성
      const query = "SELECT user_id, work FROM good_work WHERE work = ?";

      // 데이터베이스에서 해당하는 work 조회
      pool.query(query, [work], (error, results) => {
          if (error) {
              console.error('Error retrieving work:', error);
              return res.status(500).json({ message: "Internal Server Error" });
          }

          // 조회 결과가 없는 경우
          if (results.length === 0) {
              return res.status(404).json({ message: "Work not found" });
          }

          // 조회 결과를 응답으로 보냄
          res.status(200).json(results);
      });
  } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ message: "Internal Server Error" });
  }
});

//한 작품의 좋아요 수 보기
router.get('/userworkcount/:user_id', async (req, res) => {
  try {
      const { user_id } = req.params;

      // 주소에서 받은 user_id를 기반으로 쿼리문 작성
      const query = "SELECT COUNT(*) AS work_count FROM good_work WHERE user_id = ?";

      // 데이터베이스에서 해당하는 작업(work)의 개수 조회
      pool.query(query, [user_id], (error, results) => {
          if (error) {
              console.error('Error retrieving work count:', error);
              return res.status(500).json({ message: "Internal Server Error" });
          }

          // 조회 결과를 응답으로 보냄
          res.status(200).json({ work_count: results[0].work_count });
      });
  } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ message: "Internal Server Error" });
  }
});



module.exports = router;
