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

router.get('/shop/:shopId', getShopAnnouncements);
router.get('/all', getAllAnnouncements);
router.get('/', protect, authorize('admin', 'shopowner'), getAnnouncements);
router.post('/', protect, authorize('admin', 'shopowner'), createAnnouncement);
router.put('/:id', protect, authorize('admin', 'shopowner'), updateAnnouncement);
router.delete('/:id', protect, authorize('admin', 'shopowner'), deleteAnnouncement);
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
router.get('/shop/:shopId', async (req, res) => {
    try {
        const announcements = await Announcement.find({ shop: req.params.shopId }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: announcements });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

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
// GET: ดึงข้อมูลประกาศทั้งหมด (กรองตามร้านถ้าเป็น shopowner)
router.get('/', protect, authorize('admin', 'shopowner'), async (req, res) => {
    try {
        let query = {};
        // ถ้าเป็น shopowner ให้ดึงเฉพาะประกาศของร้านตัวเอง
        if (req.user.role === 'shopowner') {
            const shop = await Shop.findOne({ owner: req.user.id });
            if (shop) {
                query.shop = shop._id;
            } else {
                return res.status(200).json({ success: true, data: [] });
            }
        }

        // ดึงข้อมูลและเรียงจากใหม่ไปเก่า (desc)
        const announcements = await Announcement.find(query).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: announcements });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

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

// POST: สร้างประกาศใหม่ (admin หรือ shop owner เท่านั้น)
router.post('/', protect, authorize('admin', 'shopowner'), async (req, res) => {
    try {
        const { title, content, imageUrl } = req.body;

        let shopId;
        if (req.user.role === 'shopowner') {
            const shop = await Shop.findOne({ owner: req.user.id });
            if (!shop) {
                return res.status(404).json({ success: false, message: 'Shop not found for this user' });
            }
            shopId = shop._id;
        } else {
            // ถ้าเป็น admin ให้ใส่ shop id จาก body ได้เลย
            shopId = req.body.shop;
        }

        const newAnnouncement = await Announcement.create({
            title,
            content,
            imageUrl,
            shop: shopId
        });
        res.status(201).json({ success: true, data: newAnnouncement });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

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
// PUT: แก้ไขประกาศ (admin หรือ shop owner เท่านั้น)
router.put('/:id', protect, authorize('admin', 'shopowner'), async (req, res) => {
    try {
        const updatedAnnouncement = await Announcement.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.status(200).json({ success: true, data: updatedAnnouncement });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

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

// DELETE: ลบประกาศ (admin หรือ shop owner เท่านั้น)
router.delete('/:id', protect, authorize('admin', 'shopowner'), async (req, res) => {
    try {
        await Announcement.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: "ลบสำเร็จ" });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

module.exports = router;
