const express = require('express');
const router = express.Router();
const {
    getShopAnnouncements,
    getAllAnnouncements,
    getAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement
} = require('../controllers/announcements');
const { protect, authorize } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Announcements
 *   description: Shop announcement management
 */

/**
 * @swagger
 * /api/v1/announcements/shop/{shopId}:
 *   get:
 *     summary: Get all announcements for a specific shop (public)
 *     tags: [Announcements]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: shopId
 *         required: true
 *         schema: { type: string }
 *         description: Shop ID
 *     responses:
 *       200:
 *         description: List of announcements
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Announcement' }
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get('/shop/:shopId', getShopAnnouncements);

/**
 * @swagger
 * /api/v1/announcements/all:
 *   get:
 *     summary: Get all announcements from all shops (public)
 *     tags: [Announcements]
 *     security: []
 *     responses:
 *       200:
 *         description: List of announcements
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Announcement' }
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get('/all', getAllAnnouncements);

/**
 * @swagger
 * /api/v1/announcements:
 *   get:
 *     summary: Get all announcements (admin gets all, shopowner gets own shop only)
 *     tags: [Announcements]
 *     responses:
 *       200:
 *         description: List of announcements
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Announcement' }
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       403:
 *         description: Not authorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get('/', protect, authorize('admin', 'shopowner'), getAnnouncements);

/**
 * @swagger
 * /api/v1/announcements:
 *   post:
 *     summary: Create a new announcement (admin or shopowner only)
 *     tags: [Announcements]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, content]
 *             properties:
 *               title: { type: string }
 *               content: { type: string }
 *               imageUrl: { type: string }
 *               shop: { type: string, description: 'Required if admin' }
 *     responses:
 *       201:
 *         description: Announcement created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/Announcement' }
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
router.post('/', protect, authorize('admin', 'shopowner'), createAnnouncement);

/**
 * @swagger
 * /api/v1/announcements/{id}:
 *   put:
 *     summary: Update an announcement (admin or shopowner only)
 *     tags: [Announcements]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               content: { type: string }
 *               imageUrl: { type: string }
 *     responses:
 *       200:
 *         description: Announcement updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/Announcement' }
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
router.put('/:id', protect, authorize('admin', 'shopowner'), updateAnnouncement);

/**
 * @swagger
 * /api/v1/announcements/{id}:
 *   delete:
 *     summary: Delete an announcement (admin or shopowner only)
 *     tags: [Announcements]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Announcement deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *       400:
 *         description: Error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       403:
 *         description: Not authorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.delete('/:id', protect, authorize('admin', 'shopowner'), deleteAnnouncement);

module.exports = router;
