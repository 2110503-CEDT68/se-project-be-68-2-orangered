const { authorize } = require('../../middleware/auth');

// ========================================================
// TEST SUITE: User role CANNOT modify announcements
// The `authorize('admin', 'shopowner')` middleware blocks 'user'
// ========================================================

describe('authorize middleware - blocks user role from CUD operations', () => {

    const mockNext = jest.fn();

    const mockRes = () => {
        const res = {};
        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);
        return res;
    };

    afterEach(() => {
        jest.clearAllMocks();
    });

    // ── CREATE ──────────────────────────────────────────────
    it('should deny "user" role from creating an announcement (POST)', () => {
        const req = { user: { role: 'user' } };
        const res = mockRes();
        const middleware = authorize('admin', 'shopowner');

        middleware(req, res, mockNext);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
        expect(mockNext).not.toHaveBeenCalled();
    });

    // ── UPDATE ──────────────────────────────────────────────
    it('should deny "user" role from updating an announcement (PUT)', () => {
        const req = { user: { role: 'user' } };
        const res = mockRes();
        const middleware = authorize('admin', 'shopowner');

        middleware(req, res, mockNext);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
        expect(mockNext).not.toHaveBeenCalled();
    });

    // ── DELETE ──────────────────────────────────────────────
    it('should deny "user" role from deleting an announcement (DELETE)', () => {
        const req = { user: { role: 'user' } };
        const res = mockRes();
        const middleware = authorize('admin', 'shopowner');

        middleware(req, res, mockNext);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
        expect(mockNext).not.toHaveBeenCalled();
    });

    // ── ALLOWED ROLES ────────────────────────────────────────
    it('should allow "shopowner" role to proceed (calls next)', () => {
        const req = { user: { role: 'shopowner' } };
        const res = mockRes();
        const middleware = authorize('admin', 'shopowner');

        middleware(req, res, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow "admin" role to proceed (calls next)', () => {
        const req = { user: { role: 'admin' } };
        const res = mockRes();
        const middleware = authorize('admin', 'shopowner');

        middleware(req, res, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });
});
