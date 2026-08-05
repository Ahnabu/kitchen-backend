import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware';
import {
  getMe,
  updateMe,
  updateAvatar,
  getMyOrders,
  getMyLoyalty,
  redeemLoyalty,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
} from '../controllers/user.controller';
import { uploadAvatarImage } from '../middleware/upload.middleware';
import { validateUpdateProfile, validateAddress } from '../middleware/validate.middleware';

const router = Router();

// Apply authentication middleware to all user routes
router.use(verifyToken);

router.get('/me', getMe);
router.put('/me', validateUpdateProfile, updateMe);
router.put('/me/avatar', uploadAvatarImage, updateAvatar);
router.get('/me/orders', getMyOrders);
router.get('/me/loyalty', getMyLoyalty);
router.post('/me/loyalty/redeem', redeemLoyalty);

// Address Book routes
router.get('/me/addresses', getAddresses);
router.post('/me/addresses', validateAddress, addAddress);
router.put('/me/addresses/:id', validateAddress, updateAddress);
router.delete('/me/addresses/:id', deleteAddress);

export default router;
