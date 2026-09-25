import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { getDb } from '../config/db.js';
import { AppError } from './errorHandler.js';

export async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.split(' ')[1] 
      : null;

    if (!token) {
      throw new AppError('Authentication required. Please sign in.', 401, 'UNAUTHORIZED');
    }

    let decoded;
    try {
      decoded = jwt.verify(token, config.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new AppError('Your session has expired. Please sign in again.', 401, 'TOKEN_EXPIRED');
      }
      throw new AppError('Invalid authentication token.', 401, 'INVALID_TOKEN');
    }

    const db = getDb();
    const result = await db.query(
      'SELECT id, name, email, created_at FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('User account not found.', 401, 'USER_NOT_FOUND');
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Ensures the requesting user owns the workspace identified by :workspaceId or body.workspaceId
 */
export async function requireWorkspaceOwnership(req, res, next) {
  try {
    const workspaceId = req.params.workspaceId || req.params.id || req.body.workspaceId;
    if (!workspaceId) {
      throw new AppError('Workspace identifier is required.', 400, 'VALIDATION_ERROR');
    }

    const db = getDb();
    const result = await db.query(
      'SELECT * FROM workspaces WHERE id = $1 AND user_id = $2',
      [workspaceId, req.user.id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Workspace not found or access denied.', 404, 'WORKSPACE_NOT_FOUND');
    }

    req.workspace = result.rows[0];
    next();
  } catch (error) {
    next(error);
  }
}
