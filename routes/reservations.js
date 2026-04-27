const express = require('express');

const {getReservations, getReservation, addReservation, updateReservation, deleteReservation} = require('../controllers/reservations');

const router = express.Router({mergeParams: true});

const ratingRouter = require('./ratings');

const {protect, authorize} = require('../middleware/auth');

router.use('/:reservationId/ratings', ratingRouter);

/**
 * @swagger
 * tags:
 *   name: Reservations
 *   description: Reservation management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     PromotionSnapshot:
 *       type: object
 *       description: Snapshot of the applied promotion stored permanently on the reservation
 *       properties:
 *         title:
 *           type: string
 *           example: Flash Sale
 *         discountPrice:
 *           type: number
 *           example: 100
 *           description: Discount amount in THB at the time of booking
 */

/**
 * @swagger
 * /api/v1/reservations:
 *   get:
 *     summary: Get reservations (filtered by role)
 *     tags: [Reservations]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [active, past, cancelled] }
 *       - in: query
 *         name: shopId
 *         schema: { type: string }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: List of reservations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 count: { type: integer }
 *                 pagination: { type: object }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Reservation' }
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 * /api/v1/shops/{shopId}/reservations:
 *   post:
 *     summary: Create a reservation for a shop (user or admin only)
 *     tags: [Reservations]
 *     parameters:
 *       - in: path
 *         name: shopId
 *         required: true
 *         schema: { type: string }
 *         example: "69ef4c226e2e675a692164a6"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [appDate, massageType]
 *             properties:
 *               appDate:
 *                 type: string
 *                 format: date-time
 *                 description: Appointment date and time
 *                 example: "2025-06-01T10:00:00.000Z"
 *               massageType:
 *                 type: string
 *                 description: Must exactly match a massage type name in the shop
 *                 example: Thai Massage
 *     responses:
 *       201:
 *         description: Reservation created. Server automatically applies any active promotion on the selected massage type.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/Reservation' }
 *             examples:
 *               withPromotion:
 *                 summary: Thai Massage has an active Flash Sale (500 - 100 = 400 THB)
 *                 value:
 *                   success: true
 *                   data:
 *                     _id: "64f9a1b2c3d4e5f6a7b8c9d0"
 *                     shop: "69ef4c226e2e675a692164a6"
 *                     user: "64f1a2b3c4d5e6f7a8b9c0a0"
 *                     appDate: "2025-06-01T10:00:00.000Z"
 *                     massageType: Thai Massage
 *                     massagePrice: 400
 *                     promotion:
 *                       title: Flash Sale
 *                       discountPrice: 100
 *                     createdAt: "2025-04-28T08:00:00.000Z"
 *               noPromotion:
 *                 summary: Aromatherapy has no active promotion (full price 800 THB)
 *                 value:
 *                   success: true
 *                   data:
 *                     _id: "64f9a1b2c3d4e5f6a7b8c9d1"
 *                     shop: "69ef4c226e2e675a692164a6"
 *                     user: "64f1a2b3c4d5e6f7a8b9c0a0"
 *                     appDate: "2025-06-02T14:00:00.000Z"
 *                     massageType: Aromatherapy
 *                     massagePrice: 800
 *                     createdAt: "2025-04-28T08:05:00.000Z"
 *       400:
 *         description: Shop not found, invalid massage type, or user already has 3 active reservations
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       403:
 *         description: Not authorized (role must be user or admin)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.route('/')
    .get(protect, getReservations)
    .post(protect, authorize('admin', 'user'), addReservation);

/**
 * @swagger
 * /api/v1/reservations/{id}:
 *   get:
 *     summary: Get a single reservation
 *     tags: [Reservations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Reservation data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/Reservation' }
 *       404:
 *         description: Reservation not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *   put:
 *     summary: Update a reservation (owner or admin only)
 *     tags: [Reservations]
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
 *               appDate: { type: string, format: date-time, description: New appointment date and time }
 *     responses:
 *       200:
 *         description: Reservation updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/Reservation' }
 *       403:
 *         description: Not authorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       404:
 *         description: Reservation not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *   delete:
 *     summary: Delete a reservation (owner or admin only)
 *     tags: [Reservations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Reservation deleted
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
 *         description: Reservation not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.route('/:id')
    .get(protect, getReservation)
    .put(protect, authorize('admin', 'user', 'shopowner'), updateReservation)
    .delete(protect, authorize('admin', 'user', 'shopowner'), deleteReservation);

module.exports = router;
