const express = require('express');
const {getShop, getShops, createShop, updateShop, deleteShop} = require('../controllers/shops')

const reservationRouter = require('./reservations');
const ratingRouter = require('./ratings');

const router = express.Router();

const {protect, authorize} = require('../middleware/auth');

router.use('/:shopId/reservations/', reservationRouter);
router.use('/:shopId/rating', ratingRouter);

/**
 * @swagger
 * tags:
 *   name: Shops
 *   description: Massage shop management
 */

/**
 * @swagger
 * /api/v1/shops:
 *   get:
 *     summary: Get all shops
 *     tags: [Shops]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: ownerId
 *         schema: { type: string }
 *         description: Filter shops by owner ID
 *     responses:
 *       200:
 *         description: List of shops
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 count: { type: integer }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Shop' }
 *   post:
 *     summary: Create a new shop (shopowner or admin only)
 *     tags: [Shops]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Shop' }
 *     responses:
 *       201:
 *         description: Shop created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/Shop' }
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       403:
 *         description: Not authorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.route('/').get(getShops).post(protect, authorize('shopowner', 'admin'), createShop);

/**
 * @swagger
 * /api/v1/shops/{id}:
 *   get:
 *     summary: Get a single shop by ID
 *     tags: [Shops]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Shop data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/Shop' }
 *       404:
 *         description: Shop not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *   put:
 *     summary: Update a shop (owner or admin only)
 *     tags: [Shops]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Shop' }
 *     responses:
 *       200:
 *         description: Shop updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/Shop' }
 *       403:
 *         description: Not authorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       404:
 *         description: Shop not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *   delete:
 *     summary: Delete a shop (owner or admin only)
 *     tags: [Shops]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Shop deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: object }
 *       403:
 *         description: Not authorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       404:
 *         description: Shop not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
// GET /api/v1/shops/mine — ดึงเฉพาะร้านของ shopowner ที่ล็อกอินอยู่ (ต้องอยู่ก่อน /:id)
router.get('/mine', protect, authorize('shopowner', 'admin'), async (req, res) => {
    try {
        const Shop = require('../models/Shop');
        const shops = await Shop.find({ owner: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: shops });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.route('/:id').get(getShop).put(protect, authorize('shopowner', 'admin'), updateShop).delete(protect, authorize('shopowner', 'admin'), deleteShop);

module.exports = router;
