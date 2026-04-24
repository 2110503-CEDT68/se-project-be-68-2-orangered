const DeletedUserEmail = require('../models/DeletedUserEmail');

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const isArchivedEmail = async (email) => {
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
        return false;
    }

    return Boolean(await DeletedUserEmail.findOne({ email: normalizedEmail }));
};

const archiveDeletedUser = async (user) => {
    const email = normalizeEmail(user.email);

    await DeletedUserEmail.findOneAndUpdate(
        { email },
        {
            $set: {
                email,
                name: user.name,
                role: user.role,
                originalUserId: user._id,
                deletedAt: new Date(),
            },
        },
        {
            upsert: true,
            new: true,
            runValidators: true,
            setDefaultsOnInsert: true,
        }
    );
};

const listArchivedUsers = async () => {
    return DeletedUserEmail.find().sort({ deletedAt: -1 });
};

const restoreArchivedEmailById = async (id) => {
    return DeletedUserEmail.findByIdAndDelete(id);
};

module.exports = {
    archiveDeletedUser,
    isArchivedEmail,
    listArchivedUsers,
    restoreArchivedEmailById,
    normalizeEmail,
};