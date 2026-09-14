import { query } from '../config/database';

export const PostModel = {
  async getFeed(limit = 20, offset = 0) {
    const res = await query(
      `SELECT p.*, u.full_name as user_name, u.avatar_url as user_avatar,
              cp.business_name as commerce_name
       FROM posts p
       JOIN users u ON p.user_id = u.id
       LEFT JOIN commerce_profiles cp ON p.commerce_id = cp.id
       ORDER BY p.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return res.rows;
  },

  async createPost(userId: string, mediaUrl: string, mediaType: string, content?: string, commerceId?: string, duration?: number, thumbUrl?: string) {
    const res = await query(
      `INSERT INTO posts (user_id, media_url, media_type, content, commerce_id, duration_seconds, thumbnail_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [userId, mediaUrl, mediaType, content, commerceId, duration, thumbUrl]
    );
    return res.rows[0];
  }
};
