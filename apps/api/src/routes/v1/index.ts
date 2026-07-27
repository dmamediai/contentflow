import { Router } from "express";
import { apiKeyAuth } from "../../middleware/apiKeyAuth";
import profilesRoutes from "./profiles";
import connectRoutes from "./connect";
import accountsRoutes from "./accounts";
import postsRoutes from "./posts";
import webhooksRoutes from "./webhooks";

const router = Router();

router.use(apiKeyAuth);

router.use("/profiles", profilesRoutes);
router.use("/connect", connectRoutes);
router.use("/accounts", accountsRoutes);
router.use("/posts", postsRoutes);
router.use("/webhooks", webhooksRoutes);

export default router;
