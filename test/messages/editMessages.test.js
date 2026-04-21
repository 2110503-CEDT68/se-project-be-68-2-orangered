const { editMessage } = require('../../controllers/messages');
const Message = require('../../models/Message');

jest.mock('../../models/Message');

// ✅ define everything INSIDE the mock
jest.mock('pusher', () => {
  const mockTrigger = jest.fn().mockResolvedValue(true);

  return jest.fn().mockImplementation(() => ({
    trigger: mockTrigger
  }));
});

const Pusher = require('pusher');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('editMessage', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update message and trigger pusher', async () => {
    const req = {
      params: { id: 'msg1' },
      body: { text: 'updated text' },
      user: { id: 'user1' }
    };

    const res = mockRes();

    const mockMessage = {
      _id: 'msg1',
      text: 'old text',
      room: 'room1',
      user: 'user1',
      history: [],
      createdAt: new Date(),
      save: jest.fn().mockResolvedValue(true),
      populate: jest.fn().mockResolvedValue(true)
    };

    Message.findById.mockResolvedValue(mockMessage);

    await editMessage(req, res);

    const triggerMock = new Pusher().trigger;

    // ✅ check update logic
    expect(mockMessage.text).toBe('updated text');
    expect(mockMessage.history.length).toBe(1);

    // ✅ check pusher event
    expect(triggerMock).toHaveBeenCalledWith(
      'room1',
      'messageUpdated',
      expect.objectContaining({
        _id: 'msg1',
        text: 'updated text',
        room: 'room1'
      })
    );

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should return 404 if message not found', async () => {
    const req = {
      params: { id: 'msg1' },
      user: { id: 'user1' }
    };

    const res = mockRes();

    Message.findById.mockResolvedValue(null);

    await editMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('should return 403 if not owner', async () => {
    const req = {
      params: { id: 'msg1' },
      user: { id: 'user2' }
    };

    const res = mockRes();

    Message.findById.mockResolvedValue({
      user: 'user1'
    });

    await editMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

});