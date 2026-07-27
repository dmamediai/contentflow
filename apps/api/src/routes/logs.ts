import { Router, Request, Response, NextFunction } from "express";
import { authenticateJWT, AuthRequest } from "../middleware/auth";
import { teamContext, authorize } from "../middleware/rbac";
import { AuditLogService } from "../services/audit-log.service";

const router = Router();

const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// GET /api/logs - List audit log entries for the current team
router.get(
  "/",
  authenticateJWT,
  teamContext,
  authorize("admin:read"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await AuditLogService.listLogs(
      req.user!.teamId!,
      {
        status: req.query.status as any,
        resource: req.query.resource as string | undefined,
        platform: req.query.platform as string | undefined,
        search: req.query.search as string | undefined,
      },
      page,
      limit
    );

    res.json({
      success: true,
      data: result.data,
      total: result.total,
      failedCount: result.failedCount,
      pagination: result.pagination,
    });
  })
);

// GET /api/logs/counts - Count of logs by resource (for filter sidebar badges)
router.get(
  "/counts",
  authenticateJWT,
  teamContext,
  authorize("admin:read"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const counts = await AuditLogService.countByResource(req.user!.teamId!);
    res.json({ success: true, data: counts });
  })
);

export default router;
