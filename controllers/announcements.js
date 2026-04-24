const Announcement = require('../models/Announcement');
const Shop = require('../models/Shop');

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
// @desc    Get all announcements for a specific shop (Public)
// @route   GET /api/v1/announcements/shop/:shopId
exports.getShopAnnouncements = async (req, res) => {
    try {
        const announcements = await Announcement.find({ shop: req.params.shopId }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: announcements });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all announcements from all shops (Public)
// @route   GET /api/v1/announcements/all
exports.getAllAnnouncements = async (req, res) => {
    try {
        const announcements = await Announcement.find().populate('shop', 'name picture').sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: announcements });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

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
// @desc    Get announcements (filtered by all owner shops for shopowner, all for admin)
// @route   GET /api/v1/announcements
exports.getAnnouncements = async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'shopowner') {
            // ดึงร้านทั้งหมดของ shopowner คนนี้
            const shops = await Shop.find({ owner: req.user.id });
            if (shops.length === 0) {
                return res.status(200).json({ success: true, data: [] });
            }
            query.shop = { $in: shops.map(s => s._id) };
        }
        const announcements = await Announcement.find(query).populate('shop', 'name picture').sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: announcements });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

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
// @desc    Create a new announcement
// @route   POST /api/v1/announcements
exports.createAnnouncement = async (req, res) => {
    try {
        const { title, content, imageUrl } = req.body;
        const requestedShopId = req.body.shop;

        let resolvedShopId;

        if (req.user.role === 'shopowner') {
            if (requestedShopId) {
                // ตรวจสอบว่าร้านที่ระบุเป็นของตัวเองจริง
                const shop = await Shop.findOne({ _id: requestedShopId, owner: req.user.id });
                if (!shop) {
                    return res.status(403).json({ success: false, message: 'You are not the owner of this shop' });
                }
                resolvedShopId = shop._id;
            } else {
                // fallback: ใช้ร้านแรกที่เจอ
                const shop = await Shop.findOne({ owner: req.user.id });
                if (!shop) {
                    return res.status(404).json({ success: false, message: 'Shop not found for this user' });
                }
                resolvedShopId = shop._id;
            }
        } else {
            // admin ส่ง shopId มาตรงๆ
            resolvedShopId = requestedShopId;
        }

        const newAnnouncement = await Announcement.create({
            title,
            content,
            imageUrl,
            shop: resolvedShopId
        });
        res.status(201).json({ success: true, data: newAnnouncement });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

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
// @desc    Update an announcement
// @route   PUT /api/v1/announcements/:id
exports.updateAnnouncement = async (req, res) => {
    try {
        const updatedAnnouncement = await Announcement.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!updatedAnnouncement) {
            return res.status(404).json({ success: false, message: 'Announcement not found' });
        }
        res.status(200).json({ success: true, data: updatedAnnouncement });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

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
// @desc    Delete an announcement
// @route   DELETE /api/v1/announcements/:id
exports.deleteAnnouncement = async (req, res) => {
    try {
        const announcement = await Announcement.findByIdAndDelete(req.params.id);
        if (!announcement) {
            return res.status(404).json({ success: false, message: 'Announcement not found' });
        }
        res.status(200).json({ success: true, message: 'ลบสำเร็จ' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
