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
        let query = 'SELECT * FROM User';

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
        const query = 'DELETE FROM User WHERE user_id = ?';

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


//작품의 좋아요 수 입력
//필요한 정보 : 좋아요 작품 갯수
router.patch('/LikeCount', async (req, res) => {
  try {
      const { user_id } = req.body;

      // Likes 테이블에서 해당 user_id에 대한 like_works 개수 조회
      const countQuery = "SELECT COUNT(like_works) AS like_count FROM Likes WHERE user_id = ?";
      pool.query(countQuery, [user_id], (countError, countResults) => {
          if (countError) {
              console.error('Error counting likes:', countError);
              return res.status(500).json({ message: "Internal Server Error" });
          }

          // 조회 결과가 없는 경우
          if (countResults.length === 0) {
              return res.status(404).json({ message: "Likes not found for the user" });
          }

          const likeCount = countResults[0].like_count;

          // User 테이블에서 해당 user_id에 대한 like_count 열 업데이트
          const updateQuery = "UPDATE User SET like_count = ? WHERE user_id = ?";
          pool.query(updateQuery, [likeCount, user_id], (updateError, updateResults) => {
              if (updateError) {
                  console.error('Error updating like_count:', updateError);
                  return res.status(500).json({ message: "Internal Server Error" });
              }

              // 업데이트가 성공적으로 이루어진 경우
              res.status(200).json({ message: "Like count updated successfully" });
          });
      });
  } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ message: "Internal Server Error" });
  }
});


// 좋아요 수 보기
//필요한 정보 : 좋아요 작품 갯수
router.get('/SeeLikes', async (req, res) => {
  try {
      const { user_id } = req.query;

      // User 테이블에서 해당 user_id에 대한 like_count 조회
      const query = "SELECT like_count FROM User WHERE user_id = ?";
      pool.query(query, [user_id], (error, results) => {
          if (error) {
              console.error('Error retrieving like_count:', error);
              return res.status(500).json({ message: "Internal Server Error" });
          }

          // 조회 결과가 없는 경우
          if (results.length === 0) {
              return res.status(404).json({ message: "User not found" });
          }

          // 조회 결과를 응답으로 보냄
          res.status(200).json(results[0]);
      });
  } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ message: "Internal Server Error" });
  }
});



// 좋아요 수 삭제


// 좋아요 작품 추가(필요한 정보 : id, 좋아요 작품 이름)
//--------------------------------------------------> 한 명의 유저가 얼마나 많은 작품을 좋아요 했는지 설정함. 하나의 작품을 얼마나 많은 유저가 좋아요 했는지로 바꿔야함.
router.post('/AddLikes', async (req, res) => {
    try {
      // 요청의 Body에서 데이터 가져오기
      const likesData = req.body.likesData;
  
      // 데이터베이스에 삽입할 쿼리
      const query = 'INSERT INTO Likes (user_id, like_works) VALUES ?';
  
      // 데이터베이스에 데이터 삽입
      pool.query(query, [likesData.map(item => [item.user_id, item.like_works])], (error, results) => {
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
  

// 좋아요 작품 보기(필요한 정보 : id)
router.get('/LikesWorks', async (req, res) => {
    try {
        const { user_id } = req.query;
    
        // 쿼리문 작성
        const query = "SELECT like_works, works_address FROM Likes WHERE user_id = ?";
    
        // 데이터베이스에서 좋아하는 작품 조회
        pool.query(query, [user_id], (error, results) => {
            if (error) {
                console.error('Error retrieving likes:', error);
                return res.status(500).json({ message: "Internal Server Error" });
            }
    
            // 조회 결과가 없는 경우
            if (results.length === 0) {
                return res.status(404).json({ message: "Likes not found for the user" });
            }
    
            // 조회 결과를 응답으로 보냄
            res.status(200).json(results);
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: "Internal Server Error" });
    }
  });
  



// 좋아요 작품 삭제(필요한 정보 : id, 좋아요 작품 이름)
router.delete('/DeleteWorks', async (req, res) => {
    try {
      const { user_id, like_works } = req.body;
  
      // 유효성 검사
      if (!user_id || !like_works) {
        return res.status(400).json({ message: "User ID and like works are required" });
      }
  
      // 데이터베이스에서 좋아하는 작품 삭제하는 쿼리
      const query = 'DELETE FROM Likes WHERE user_id = ? AND like_works = ?';
  
      // 데이터베이스에서 좋아하는 작품 삭제
      pool.query(query, [user_id, like_works], (error, result) => {
        if (error) {
          console.error('Error deleting like:', error);
          return res.status(500).json({ message: "Internal Server Error" });
        }
  
        // 삭제된 행이 없으면
        if (result.affectedRows === 0) {
          return res.status(404).json({ message: "Like not found for the user" });
        }
  
        // 삭제가 성공적으로 이루어지면
        res.status(200).json({ message: "Like deleted successfully" });
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });



module.exports = router;
