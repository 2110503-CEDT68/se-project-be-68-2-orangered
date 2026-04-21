const { deleteMessage } = require('../../controllers/messages');
const Message = require('../../models/Message');

jest.mock('../../models/Message');

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

describe('deleteMessage', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete message and trigger pusher', async () => {
    const req = {
      params: { id: 'msg1' },
      user: { id: 'user1' }
    };

    const res = mockRes();

    const mockMessage = {
      _id: 'msg1',
      room: 'room1',
      user: 'user1',
      save: jest.fn().mockResolvedValue(true)
    };

    Message.findById.mockResolvedValue(mockMessage);

    await deleteMessage(req, res);

    const triggerMock = new Pusher().trigger;

    expect(triggerMock).toHaveBeenCalledWith(
      'room1',
      'messageDeleted',
      { _id: 'msg1' }
    );

    expect(res.status).toHaveBeenCalledWith(200);
  });

});